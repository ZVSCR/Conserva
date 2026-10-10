jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    createCompraRepo: jest.fn(),
    adicionaItensACompraRepo: jest.fn()
}));

const {
    createCompraRepo,
    adicionaItensACompraRepo
} = require('../../Backend/src/repositories/compraRepository');
const {
    createCompraService,
    adicionaItensACompraService
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
        adicionaItensACompraRepo.mockResolvedValue({ id: 42 });
    });

    test('encaminha uma compra com todos os itens para uma única operação de persistência', async () => {
        const payload = createValidPayload();

        await createCompraService(7, payload);

        expect(createCompraRepo).toHaveBeenCalledTimes(1);
        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.itens).toEqual(payload.itens.map(item => ({ ...item, tipo_medida: 'variavel' })));
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

    test('calcula cada pacote variável sem mudar o preço por kg', async () => {
        const payload = createValidPayload();
        payload.itens = [{
            nome_item: 'Granola', quantidade: 0.5, unidade_de_medida: 'kg',
            valor_unitario: 20, numero_embalagens: 2
        }];

        await createCompraService(7, payload);

        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.valor_total).toBe(20);
        expect(dados.itens).toHaveLength(2);
        expect(dados.itens[0]).toEqual(dados.itens[1]);
    });

    test('mantém três maçãs num lote pelo preço por maçã', async () => {
        const payload = createValidPayload();
        payload.itens = [{
            nome_item: 'Maçã', quantidade: 3, unidade_de_medida: 'un', valor_unitario: 2
        }];

        await createCompraService(7, payload);

        const [dados] = createCompraRepo.mock.calls[0];
        expect(dados.valor_total).toBe(6);
        expect(dados.itens).toHaveLength(1);
        expect(dados.itens[0].tipo_medida).toBe('unitaria');
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

test('adiciona embalagens variáveis à compra pelo preço da medida', async () => {
    jest.clearAllMocks();
    adicionaItensACompraRepo.mockResolvedValue({ id: 42 });
    const itens = [{
        nome_item: 'Granola', quantidade: 0.5, unidade_de_medida: 'kg',
        valor_unitario: 20, numero_embalagens: 2
    }];

    await adicionaItensACompraService(7, 42, { itens });

    expect(adicionaItensACompraRepo).toHaveBeenCalledTimes(1);
    const [dados] = adicionaItensACompraRepo.mock.calls[0];
    expect(dados.valor_itens_novos).toBe('20.00');
    expect(dados.itens).toHaveLength(2);
    expect(dados.itens.every(item => item.tipo_medida === 'variavel')).toBe(true);
});
