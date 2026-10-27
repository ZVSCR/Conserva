jest.mock('../../Backend/src/config/transactionDatabase', () => ({ query: jest.fn() }));
jest.mock('../../Backend/src/config/database', () => jest.fn());

const pool = require('../../Backend/src/config/transactionDatabase');
const { inserirIngredientesPadrao, buscarIdsIngredientes } = require('../../Backend/src/repositories/ingredienteRepository');

beforeEach(() => jest.clearAllMocks());

const sql = require('../../Backend/src/config/database');
const { deleteIngredienteRepo, updateIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository');

test('exclui ingrediente por ID com consulta parametrizada e retorna o registro', async () => {
    sql.mockResolvedValueOnce([{ id: 12 }]);
    await expect(deleteIngredienteRepo(12)).resolves.toEqual({ id: 12 });
    expect(sql).toHaveBeenCalledTimes(1);
    const [partes, id] = sql.mock.calls[0];
    expect(partes.join('?')).toMatch(/DELETE FROM ingrediente\s+WHERE id = \?\s+RETURNING id/);
    expect(id).toBe(12);
});

test('exclusão retorna undefined quando o ingrediente não existe', async () => {
    sql.mockResolvedValueOnce([]);
    await expect(deleteIngredienteRepo(999)).resolves.toBeUndefined();
});

test('exclusão propaga falhas do banco', async () => {
    const erro = new Error('Banco indisponível');
    sql.mockRejectedValueOnce(erro);
    await expect(deleteIngredienteRepo(12)).rejects.toBe(erro);
});

describe('atualização de ingrediente', () => {
    test('atualiza o nome pelo ID com SQL parametrizado e retorna o mesmo ID', async () => {
        const atualizado = { id: 12, nome: 'novo nome' };
        sql.mockResolvedValueOnce([atualizado]);

        await expect(updateIngredienteRepo(12, { nome: 'novo nome' })).resolves.toEqual(atualizado);

        expect(sql).toHaveBeenCalledTimes(1);
        const [partes, ...valores] = sql.mock.calls[0];
        expect(partes.join('?')).toMatch(/UPDATE ingrediente\s+SET nome = \?\s+WHERE id = \?\s+RETURNING id, nome/);
        expect(valores).toEqual(['novo nome', 12]);
    });

    test('retorna undefined quando o ID não existe', async () => {
        sql.mockResolvedValueOnce([]);
        await expect(updateIngredienteRepo(12, { nome: 'novo nome' })).resolves.toBeUndefined();
    });

    test('propaga conflito de nome imposto pelo banco', async () => {
        const erro = Object.assign(new Error('Duplicado'), { code: '23505' });
        sql.mockRejectedValueOnce(erro);
        await expect(updateIngredienteRepo(12, { nome: 'leite' })).rejects.toBe(erro);
    });
});

test('insere nomes em lote sem apagar ou alterar ingredientes existentes', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const nomes = ['leite', 'maca'];

    await expect(inserirIngredientesPadrao(nomes)).resolves.toBe(1);
    expect(pool.query).toHaveBeenCalledTimes(1);
    const [consulta, parametros] = pool.query.mock.calls[0];
    expect(consulta).toMatch(/INSERT INTO ingrediente \(nome\)/);
    expect(consulta).toMatch(/SELECT DISTINCT nome/);
    expect(consulta).toMatch(/ON CONFLICT \(nome\) DO NOTHING/);
    expect(consulta).not.toMatch(/\b(?:DELETE|TRUNCATE|UPDATE)\b/);
    expect(parametros).toEqual([nomes]);
});

test('uma nova execução é permitida e não exige novos registros', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await expect(inserirIngredientesPadrao(['leite'])).resolves.toBe(0);
    await expect(inserirIngredientesPadrao(['leite'])).resolves.toBe(0);
    expect(pool.query).toHaveBeenCalledTimes(2);
});

test('rejeita lista vazia sem consultar o banco e propaga erro de conexão', async () => {
    await expect(inserirIngredientesPadrao([])).rejects.toThrow(TypeError);
    expect(pool.query).not.toHaveBeenCalled();

    const erro = new Error('Banco indisponível');
    pool.query.mockRejectedValue(erro);
    await expect(inserirIngredientesPadrao(['leite'])).rejects.toBe(erro);
});

test('busca IDs em lote e deixa opcionais ausentes sem classificação', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ id: 7, nome: 'leite' }] }) };

    await expect(buscarIdsIngredientes(client, ['leite', 'coco ralado'], ['leite']))
        .resolves.toEqual(new Map([['leite', 7]]));
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][1]).toEqual([['leite', 'coco ralado']]);
});

test('ingrediente padrão ausente continua sendo erro', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };

    await expect(buscarIdsIngredientes(client, ['leite', 'coco ralado'], ['leite']))
        .rejects.toThrow('Ingrediente padrão ausente no banco: leite');
});
