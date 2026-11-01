const request = require('supertest');
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/repositories/itemRepository', () => ({
    buscarItens: jest.fn(), buscarPorId: jest.fn(), atualizarPorId: jest.fn(),
    apagarPorId: jest.fn(), buscarItensPorUsuario: jest.fn()
}));

const repo = require('../../Backend/src/repositories/itemRepository');
const app = require('../../Backend/src/app');
const { createSessionToken, SESSION_COOKIE_NAME } = require('../../Backend/src/config/session');
const cookie = () => `${SESSION_COOKIE_NAME}=${createSessionToken(7)}`;

beforeEach(() => jest.resetAllMocks());

describe('edição e exclusão de produtos pela tela de estoque', () => {
    test('renomeia o produto usando o usuário autenticado', async () => {
        const item = { id: 12, nome_item: 'Arroz integral' };
        repo.atualizarPorId.mockResolvedValue(item);
        const res = await request(app).patch('/api/items/12').set('Cookie', cookie())
            .query({ usuario_id: 1 }).send({ nome_item: item.nome_item });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'success', message: 'Item atualizado com sucesso.', data: item });
        expect(repo.atualizarPorId).toHaveBeenCalledWith(12, expect.objectContaining({ nome_item: item.nome_item }), 7);
    });

    test.each(['', '   ', 42, 'x'.repeat(101)])('rejeita nome inválido %p', async nome_item => {
        const res = await request(app).patch('/api/items/12').set('Cookie', cookie()).send({ nome_item });
        expect(res.status).toBe(400);
        expect(repo.atualizarPorId).not.toHaveBeenCalled();
    });

    test('exclui o produto e retorna 204 sem corpo', async () => {
        repo.apagarPorId.mockResolvedValue({ id: 12 });
        const res = await request(app).delete('/api/items/12').set('Cookie', cookie()).query({ usuario_id: 1 });
        expect(res.status).toBe(204);
        expect(res.text).toBe('');
        expect(repo.apagarPorId).toHaveBeenCalledWith('12', 7);
    });

    describe.each([['patch', 'atualizarPorId'], ['delete', 'apagarPorId']])('%s /api/items/12', (metodo, funcao) => {
        const executar = (autenticado = true) => {
            const req = request(app)[metodo]('/api/items/12').query({ usuario_id: 1 });
            if (autenticado) req.set('Cookie', cookie());
            return metodo === 'patch' ? req.send({ nome_item: 'Novo nome' }) : req;
        };

        test('recusa acesso sem sessão', async () => {
            const res = await executar(false);
            expect(res.status).toBe(401);
            expect(repo[funcao]).not.toHaveBeenCalled();
        });

        test('retorna 404 para item ausente no domínio do usuário', async () => {
            repo[funcao].mockResolvedValue(undefined);
            const res = await executar();
            expect(res.status).toBe(404);
            expect(repo[funcao].mock.calls[0].at(-1)).toBe(7);
        });

        test('retorna 500 sem expor detalhes internos', async () => {
            repo[funcao].mockRejectedValue(new Error('detalhe privado'));
            const res = await executar();
            expect(res.status).toBe(500);
            expect(JSON.stringify(res.body)).not.toContain('detalhe privado');
        });
    });
});
