jest.mock('../../Backend/src/config/transactionDatabase', () => ({ query: jest.fn() }));
jest.mock('../../Backend/src/config/database', () => jest.fn());

const pool = require('../../Backend/src/config/transactionDatabase');
const { inserirIngredientesPadrao } = require('../../Backend/src/repositories/ingredienteRepository');

beforeEach(() => jest.clearAllMocks());

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
