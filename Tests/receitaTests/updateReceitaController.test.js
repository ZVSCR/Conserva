// PATCH /api/receitas/:id recebe os três campos básicos da receita.
jest.mock('../../Backend/src/config/database.js', () => ({}));
jest.mock('../../Backend/src/repositories/receitaRepository.js', () => ({
    createReceitaRepo: jest.fn()
}));
jest.mock('../../Backend/src/services/receitaService.js', () => ({
    createReceitaService: jest.fn(),
    updateReceitaService: jest.fn()
}));
jest.mock('../../Backend/src/services/receitaPreparoService.js', () => ({
    prepararReceitaService: jest.fn(),
    verificarReceitaService: jest.fn()
}));

const { patchReceitaById } = require('../../Backend/src/controllers/receitaController');
const { updateReceitaService } = require('../../Backend/src/services/receitaService');

const payloadValido = {
    nome: 'Bolo de fubá',
    descricao: 'Receita simples',
    modo_preparo: 'Misture e asse.'
};

function responseMock() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

async function executar(id, body) {
    const res = responseMock();
    await patchReceitaById({ params: { id }, body, user: { id: 7 } }, res);
    return res;
}

beforeEach(() => jest.clearAllMocks());

describe('patchReceitaById', () => {
    test.each(['0', '-1', 'abc', '1.5', '01', '1e2', '2147483648', '9007199254740992'])(
        'rejeita id inválido ou fora do limite: %s', async (id) => {
            const res = await executar(id, payloadValido);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ erro: 'id deve ser um inteiro positivo.' });
            expect(updateReceitaService).not.toHaveBeenCalled();
        }
    );

    test.each([undefined, null, {}, [], 'texto'])(
        'rejeita payload ausente ou não objeto: %p', async (body) => {
            const res = await executar('7', body);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(updateReceitaService).not.toHaveBeenCalled();
        }
    );

    test.each([
        ['nome', undefined], ['nome', null], ['nome', '   '], ['nome', 'x'.repeat(101)],
        ['descricao', undefined], ['descricao', 42], ['descricao', 'x'.repeat(1001)],
        ['modo_preparo', undefined], ['modo_preparo', false], ['modo_preparo', 'x'.repeat(10001)]
    ])('rejeita %s inválido sem atualizar', async (campo, valor) => {
        const res = await executar('7', { ...payloadValido, [campo]: valor });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            errors: expect.arrayContaining([expect.objectContaining({ field: campo })])
        }));
        expect(updateReceitaService).not.toHaveBeenCalled();
    });

    test('exige os três campos mesmo quando somente um valor mudou', async () => {
        const res = await executar('7', { nome: 'Nome novo' });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            errors: expect.arrayContaining([
                expect.objectContaining({ field: 'descricao' }),
                expect.objectContaining({ field: 'modo_preparo' })
            ])
        }));
        expect(updateReceitaService).not.toHaveBeenCalled();
    });

    test('envia os três campos ao serviço e retorna a receita atualizada', async () => {
        const receitaAtualizada = { id: 7, ...payloadValido, nome: 'Bolo novo' };
        updateReceitaService.mockResolvedValue(receitaAtualizada);
        const body = { ...payloadValido, nome: ' Bolo novo ' };

        const res = await executar('7', body);

        expect(updateReceitaService).toHaveBeenCalledTimes(1);
        expect(updateReceitaService).toHaveBeenCalledWith(7, body, 7);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Receita atualizada com sucesso',
            receitaAtualizada
        });
    });

    test('aceita o maior id SERIAL', async () => {
        updateReceitaService.mockResolvedValue({ id: 2147483647, ...payloadValido });

        const res = await executar('2147483647', payloadValido);

        expect(updateReceitaService).toHaveBeenCalledWith(2147483647, payloadValido, 7);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('retorna 404 quando a receita não existe', async () => {
        updateReceitaService.mockResolvedValue(undefined);

        const res = await executar('999', payloadValido);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ erro: 'Receita não encontrada' });
    });

    test('retorna 500 sem vazar detalhes quando ocorre falha inesperada', async () => {
        updateReceitaService.mockRejectedValue(new Error('senha interna do banco'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
            const res = await executar('7', payloadValido);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor.' });
            expect(JSON.stringify(res.json.mock.calls)).not.toContain('senha interna do banco');
        } finally {
            consoleSpy.mockRestore();
        }
    });
});
