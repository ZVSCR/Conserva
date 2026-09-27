jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    createCompraRepo: jest.fn()
}));

const {
    createCompraRepo
} = require('../../Backend/src/repositories/compraRepository');
const {
    createCompraService
} = require('../../Backend/src/services/compraService');

function createValidPayload() {
    return {
        data_compra: '2026-09-20',
        estabelecimento: 'Atacadão',
        itens: [
            {
                nome_item: 'Arroz',
                quantidade: 2,
                unidade_de_medida: 'kg',
                valor_unitario: 8.5,
                validade_estimada: '2027-03-01'
            },
            {
                nome_item: 'Feijão',
                quantidade: 3,
                unidade_de_medida: 'kg',
                valor_unitario: 4,
                validade_estimada: '2027-01-01'
            }
        ]
    };
}

describe('createCompraService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createCompraRepo.mockResolvedValue({ id: 42 });
    });

    test('encaminha uma compra com todos os itens para uma única operação de persistência', async () => {
        const payload = createValidPayload();

        await createCompraService(7, payload);

        expect(createCompraRepo).toHaveBeenCalledTimes(1);
        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.itens).toEqual(payload.itens);
    });

    test('associa a compra ao usuário autenticado, não ao ID enviado no payload', async () => {
        const payload = {
            ...createValidPayload(),
            usuario_id: 999
        };

        await createCompraService(7, payload);

        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.usuario_id).toBe(7);
    });

    test('calcula o valor total somando quantidade vezes valor unitário de cada item', async () => {
        const payload = {
            ...createValidPayload(),
            valor_total: 1
        };

        await createCompraService(7, payload);

        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.valor_total).toBe(29);
    });

    test('representa o total monetário com precisão de centavos', async () => {
        const payload = createValidPayload();
        payload.itens = [{
            ...payload.itens[0],
            quantidade: 3,
            valor_unitario: 0.1
        }];

        await createCompraService(7, payload);

        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.valor_total).toBe(0.3);
    });

    test('aceita compra de item gratuito com total zero', async () => {
        const payload = createValidPayload();
        payload.itens = [{
            ...payload.itens[0],
            valor_unitario: 0
        }];

        await createCompraService(7, payload);

        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.valor_total).toBe(0);
    });

    test('só conclui após a operação de persistência e devolve seu resultado', async () => {
        let concluirPersistencia;
        createCompraRepo.mockImplementation(() => new Promise(resolve => {
            concluirPersistencia = resolve;
        }));
        let servicoConcluido = false;

        const operacao = createCompraService(7, createValidPayload());
        operacao.then(() => {
            servicoConcluido = true;
        });

        expect(createCompraRepo).toHaveBeenCalledTimes(1);
        expect(servicoConcluido).toBe(false);

        const compraCriada = { id: 42, valor_total: 29 };
        concluirPersistencia(compraCriada);

        await expect(operacao).resolves.toEqual(compraCriada);
        expect(servicoConcluido).toBe(true);
    });

    test('propaga a falha da persistência sem informar sucesso', async () => {
        const falha = new Error('Falha ao gravar compra');
        createCompraRepo.mockRejectedValue(falha);

        await expect(createCompraService(7, createValidPayload()))
            .rejects.toBe(falha);
        expect(createCompraRepo).toHaveBeenCalledTimes(1);
    });
});
