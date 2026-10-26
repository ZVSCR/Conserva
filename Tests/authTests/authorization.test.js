const request = require('supertest');
const bcrypt = require('bcrypt');
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/authRepository', () => ({ loginRepo: jest.fn(), registerRepo: jest.fn() }));
jest.mock('../../Backend/src/repositories/userRepository', () => ({
    findUserDataById: jest.fn(), findPreferencesByUserId: jest.fn(), updatePreferences: jest.fn(),
    buscarGastosTotaisPorUsuario: jest.fn(), updateUserData: jest.fn()
}));
jest.mock('../../Backend/src/repositories/compraRepository', () => {
    const actual = jest.requireActual('../../Backend/src/repositories/compraRepository');
    return { ...actual, listarComprasUsuario: jest.fn(), listarCompraPorId: jest.fn(),
        atualizarCompraPorId: jest.fn(), apagarCompraPorId: jest.fn(), atualizarPorCompraId: jest.fn() };
});
jest.mock('../../Backend/src/repositories/itemRepository', () => ({
    buscarItens: jest.fn(), buscarPorId: jest.fn(), atualizarPorId: jest.fn(),
    apagarPorId: jest.fn(), buscarItensPorUsuario: jest.fn()
}));
jest.mock('../../Backend/src/repositories/estoqueRepository', () => ({
    buscarEstoque: jest.fn(), buscarDetalheEstoque: jest.fn(), atualizarQuantidade: jest.fn(),
    buscarValorEstoquePorUsuario: jest.fn(), buscarItensEstoquePorUsuario: jest.fn(), buscarConsumo: jest.fn()
}));
jest.mock('../../Backend/src/repositories/receitaRepository', () => {
    const actual = jest.requireActual('../../Backend/src/repositories/receitaRepository');
    return { ...actual, listReceitasRepo: jest.fn(), getReceitaByIdRepo: jest.fn(),
        updateReceitaRepo: jest.fn(), listarPreparosPorUsuario: jest.fn(), getGastoPorReceitaRepo: jest.fn() };
});

const app = require('../../Backend/src/app');
const auth = require('../../Backend/src/repositories/authRepository');
const users = require('../../Backend/src/repositories/userRepository');
const compras = require('../../Backend/src/repositories/compraRepository');
const items = require('../../Backend/src/repositories/itemRepository');
const estoque = require('../../Backend/src/repositories/estoqueRepository');
const receitas = require('../../Backend/src/repositories/receitaRepository');
const sql = require('../../Backend/src/config/database');
const accounts = [7, 42].map((id) => ({ id, username: 'conta' + id, email: 'conta' + id + '@example.com', tipo: 'domestico' }));
let hash;

beforeAll(async () => { hash = await bcrypt.hash('senha-teste', 4); });
beforeEach(() => {
    jest.clearAllMocks();
    auth.loginRepo.mockImplementation(async ({ identifier }) => {
        const user = accounts.find((account) => account.username === identifier);
        return user ? { ...user, password_hash: hash } : null;
    });
    users.findUserDataById.mockImplementation(async (id) => accounts.find((account) => account.id === id));
    compras.listarComprasUsuario.mockImplementation(async (id) => [{ id: id * 10, usuario_id: id }]);
    compras.listarCompraPorId.mockImplementation(async (id, compraId) => {
        if (compraId !== id * 10) throw new compras.CompraNaoEncontradaError();
        return [{ id: compraId, usuario_id: id }];
    });
    items.buscarPorId.mockImplementation(async (id, owner) => Number(id) === owner * 10 ? { id: Number(id) } : undefined);
    items.atualizarPorId.mockImplementation(async (id, fields, owner) => id === owner * 10 ? { id, ...fields } : undefined);
    items.apagarPorId.mockImplementation(async (id, owner) => Number(id) === owner * 10 ? { id } : undefined);
    estoque.buscarEstoque.mockImplementation(async (id) => [{ item_id: id * 10 }]);
    estoque.buscarDetalheEstoque.mockImplementation(async (owner, id) => id === owner * 10 ? { quantidade_original: '3', tipo_medida: 'unitaria' } : undefined);
    receitas.getReceitaByIdRepo.mockImplementation(async (id, owner) => id === 100 || id === owner * 10 ? { id } : undefined);
    receitas.updateReceitaRepo.mockImplementation(async (id, payload, owner) => id === owner * 10 ? { id, ...payload } : undefined);
    receitas.listarPreparosPorUsuario.mockImplementation(async (id) => [{ id: id * 10 }]);
    users.findPreferencesByUserId.mockImplementation(async (id) => ({ notify_push: id === 7, notify_email: true, is_dark_theme: false }));
    users.updatePreferences.mockImplementation(async (id, changes) => ({ id, ...changes }));
    users.buscarGastosTotaisPorUsuario.mockImplementation(async (id) => [{ id, total_gasto: 10 }]);
});

async function connect(id) {
    const agent = request.agent(app);
    const response = await agent.post('/api/auth/login').send({ identifier: 'conta' + id, password: 'senha-teste' });
    expect(response.status).toBe(200);
    return agent;
}

test.each([
    ['get', '/api/users/me'], ['get', '/api/users/me/preferences'], ['patch', '/api/users/me/preferences'],
    ['get', '/api/users/gastos'], ['get', '/api/compras'], ['post', '/api/compras'],
    ['get', '/api/items'], ['get', '/api/items/70'], ['patch', '/api/items/70'], ['delete', '/api/items/70'],
    ['get', '/api/estoque'], ['patch', '/api/estoque/70'], ['get', '/api/receitas'],
    ['patch', '/api/receitas/70'], ['post', '/api/receitas/70/preparar'],
    ['get', '/api/receitas/preparadas'], ['get', '/api/receitas/gastos'],
    ['post', '/api/ingredientes'], ['patch', '/api/ingredientes/1']
])('%s %s exige cookie de sessão, mesmo com usuario_id forjado', async (method, path) => {
    const response = await request(app)[method](path).query({ usuario_id: 7 }).send({ usuario_id: 7 });
    expect(response.status).toBe(401);
    expect(users.findUserDataById).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
});

test.each([7, 42])('a sessão %s determina compras, estoque, preferências e histórico', async (id) => {
    const agent = await connect(id);
    expect((await agent.get('/api/compras?usuario_id=999')).body.data[0].usuario_id).toBe(id);
    expect((await agent.get('/api/estoque?usuario_id=999')).body[0].item_id).toBe(id * 10);
    expect((await agent.get('/api/users/me')).body.data.id).toBe(id);
    expect((await agent.get('/api/users/me/preferences')).body.data.notify_push).toBe(id === 7);
    expect((await agent.get('/api/receitas/preparadas?usuario_id=999')).body.refeicoesPreparadas[0].id).toBe(id * 10);
    expect((await agent.get('/api/users/gastos')).body.data[0].id).toBe(id);
    await agent.patch('/api/users/me/preferences').send({ notify_push: false, usuario_id: 999 });
    expect(users.updatePreferences).toHaveBeenCalledWith(id, expect.objectContaining({ notify_push: false }));
});

test('uma conta não consulta, altera ou exclui os itens e compras da outra', async () => {
    const agent = await connect(7);
    expect((await agent.get('/api/compras/420?usuario_id=42')).status).toBe(404);
    expect((await agent.get('/api/items/420')).status).toBe(404);
    expect((await agent.patch('/api/items/420').send({ nome_item: 'Outro nome' })).status).toBe(404);
    expect((await agent.delete('/api/items/420')).status).toBe(404);
    expect((await agent.patch('/api/estoque/420?usuario_id=42').send({ quantidade: 1 })).status).toBe(404);
    expect(items.atualizarPorId).toHaveBeenCalledWith(420, expect.any(Object), 7);
    expect(items.apagarPorId).toHaveBeenCalledWith('420', 7);
    expect(estoque.atualizarQuantidade).not.toHaveBeenCalled();
});

test('receitas públicas podem ser consultadas, mas só receitas próprias podem ser editadas', async () => {
    const agent = await connect(7);
    expect((await agent.get('/api/receitas/100')).status).toBe(200);
    expect((await agent.get('/api/receitas/420')).status).toBe(404);
    const payload = { nome: 'Receita', descricao: 'Descrição', modo_preparo: 'Misture.' };
    expect((await agent.patch('/api/receitas/100').send(payload)).status).toBe(404);
    expect((await agent.patch('/api/receitas/420').send(payload)).status).toBe(404);
    expect((await agent.patch('/api/receitas/70').send(payload)).status).toBe(200);
});

test('a rota fixa de gastos não é interpretada como id de receita', async () => {
    receitas.getGastoPorReceitaRepo.mockResolvedValue([]);
    const agent = await connect(7);
    expect((await agent.get('/api/receitas/gastos?usuario_id=42')).status).toBe(200);
    expect(receitas.getGastoPorReceitaRepo).toHaveBeenCalledWith({ usuarioId: 7 });
});

test('exclusão de ingrediente é recusada antes da identificação ou consulta ao banco', async () => {
    expect((await request(app).delete('/api/ingredientes/1?usuario_id=1')).status).toBe(403);
    expect(users.findUserDataById).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
});

test('o cookie de uma sessão encerrada não recupera os dados pessoais', async () => {
    const agent = await connect(7);
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/estoque?usuario_id=7')).status).toBe(401);
});
