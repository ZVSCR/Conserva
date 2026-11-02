jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const pool = require('../../Backend/src/config/transactionDatabase');
const { inserirIngredienteReceitaRepo, ReceitaNaoEncontradaError, IngredienteNaoEncontradoError } = require('../../Backend/src/repositories/receitaRepository');
const payload = { ingrediente_id: 88, quantidade: 1.25, unidade_de_medida: 'kg' };

describe('inserirIngredienteReceitaRepo', () => {
    let client;
    let vinculo;
    beforeEach(() => {
        jest.resetAllMocks();
        vinculo = { receita_id: 9, ingrediente_id: 88, quantidade: '1.25', unidade_de_medida: 'kg' };
        client = {
            query: jest.fn(async (query) => {
                if (query.includes('FROM receita')) return { rows: [{ id: 9 }] };
                if (query.includes('FROM ingrediente')) return { rows: [{ id: 88 }] };
                if (query.includes('INSERT INTO receita_ingrediente')) return { rows: [vinculo] };
                return { rows: [] };
            }),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(client);
    });

    test('verifica a propriedade e associa o ingrediente selecionado por ID sem alterar o catálogo', async () => {
        await expect(inserirIngredienteReceitaRepo(9, payload, 7)).resolves.toEqual(vinculo);
        expect(client.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1 AND usuario_id = $2'), [9, 7]);
        expect(client.query).toHaveBeenCalledWith(expect.stringContaining('FROM ingrediente WHERE id = $1'), [88]);
        expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO receita_ingrediente'), [9, 88, 1.25, 'kg']);
        expect(client.query.mock.calls.some(([q]) => q.includes('INSERT INTO ingrediente'))).toBe(false);
        expect(client.query.mock.calls[0][0]).toBe('BEGIN');
        expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('rejeita ingrediente ausente sem criá-lo nem registrar vínculo', async () => {
        client.query.mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 9 }] })
            .mockResolvedValueOnce({ rows: [] });
        await expect(inserirIngredienteReceitaRepo(9, payload, 7)).rejects.toBeInstanceOf(IngredienteNaoEncontradoError);
        expect(client.query.mock.calls.some(([q]) => q.includes('INSERT'))).toBe(false);
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('não insere ingredientes quando a consulta não confirma a propriedade da receita', async () => {
        client.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
        await expect(inserirIngredienteReceitaRepo(9, payload, 7)).rejects.toBeInstanceOf(ReceitaNaoEncontradaError);
        expect(client.query.mock.calls.some(([q]) => q.includes('INSERT'))).toBe(false);
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('faz rollback de toda a operação quando o vínculo falha', async () => {
        const error = Object.assign(new Error('duplicado'), { code: '23505' });
        client.query.mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 9 }] })
            .mockResolvedValueOnce({ rows: [{ id: 88 }] })
            .mockRejectedValueOnce(error);
        await expect(inserirIngredienteReceitaRepo(9, payload, 7)).rejects.toBe(error);
        expect(client.query).toHaveBeenCalledWith('ROLLBACK');
        expect(client.query).not.toHaveBeenCalledWith('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});
