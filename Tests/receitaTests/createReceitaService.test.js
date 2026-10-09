jest.mock('../../Backend/src/repositories/receitaRepository', () => ({
    createReceitaRepo: jest.fn()
}));

const {
    createReceitaRepo
} = require('../../Backend/src/repositories/receitaRepository');
const {
    createReceitaService
} = require('../../Backend/src/services/receitaService');

function createValidPayload() {
    return {
        nome: 'Bolo de Fubá',
        descricao: 'Bolo simples e gostoso. Tempo de preparo: 60min',
        modo_preparo: 'Misture os ingredientes, leve ao forno e aguarde.'
    };
}

describe('createReceitaService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createReceitaRepo.mockResolvedValue({ id: 42 });
    });

    test('encaminha os dados da receita para uma única operação de persistência', async () => {
        const payload = createValidPayload();

        await createReceitaService(payload);

        expect(createReceitaRepo).toHaveBeenCalledTimes(1);
        expect(createReceitaRepo).toHaveBeenCalledWith(payload);
    });

    test('só conclui após a operação de persistência e devolve seu resultado', async () => {
        let concluirPersistencia;
        createReceitaRepo.mockImplementation(() => new Promise(resolve => {
            concluirPersistencia = resolve;
        }));
        let servicoConcluido = false;

        const operacao = createReceitaService(createValidPayload());
        operacao.then(() => {
            servicoConcluido = true;
        });

        expect(createReceitaRepo).toHaveBeenCalledTimes(1);
        expect(servicoConcluido).toBe(false);

        const receitaCriada = { id: 42 };
        concluirPersistencia(receitaCriada);

        await expect(operacao).resolves.toEqual(receitaCriada);
        expect(servicoConcluido).toBe(true);
    });

    test('propaga a falha da persistência sem informar sucesso', async () => {
        const falha = new Error('Falha ao gravar receita');
        createReceitaRepo.mockRejectedValue(falha);

        await expect(createReceitaService(createValidPayload()))
            .rejects.toBe(falha);
        expect(createReceitaRepo).toHaveBeenCalledTimes(1);
    });
});