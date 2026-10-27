jest.mock('../../Backend/src/repositories/receitaRepository', () => ({
    updateReceitaRepo: jest.fn()
}));

const { updateReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');
const { updateReceitaService } = require('../../Backend/src/services/receitaService');

beforeEach(() => jest.clearAllMocks());

const payloadValido = {
    nome: 'Bolo novo',
    descricao: 'Descrição original',
    modo_preparo: 'Preparo original'
};

describe('updateReceitaService', () => {
    test('normaliza o nome e encaminha os três campos ao repositório', async () => {
        const receita = {
            id: 7, ...payloadValido
        };
        updateReceitaRepo.mockResolvedValue(receita);

        await expect(updateReceitaService(7, { ...payloadValido, nome: '  Bolo novo  ' }, 7))
            .resolves.toEqual(receita);

        expect(updateReceitaRepo).toHaveBeenCalledTimes(1);
        expect(updateReceitaRepo).toHaveBeenCalledWith(7, payloadValido, 7);
    });

    test('encaminha valores inalterados junto ao campo modificado', async () => {
        const payload = { ...payloadValido, descricao: 'Nova descrição' };
        updateReceitaRepo.mockResolvedValue({ id: 7, ...payload });

        await updateReceitaService(7, payload, 7);

        expect(updateReceitaRepo).toHaveBeenCalledWith(7, payload, 7);
    });

    test('propaga ausência da receita', async () => {
        updateReceitaRepo.mockResolvedValue(null);

        await expect(updateReceitaService(999, payloadValido, 7)).resolves.toBeNull();
    });

    test('propaga falha de persistência', async () => {
        const erro = new Error('Falha de conexão');
        updateReceitaRepo.mockRejectedValue(erro);

        await expect(updateReceitaService(7, payloadValido, 7)).rejects.toBe(erro);
    });
});
