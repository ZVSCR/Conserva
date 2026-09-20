const request = require('supertest');

jest.mock('../../Backend/src/config/database.js', () => {
    const sql = jest.fn();
    sql.query = jest.fn();
    sql.transaction = jest.fn();
    return sql;
});

jest.mock('../../Backend/src/repositories/compraRepository.js', () => {
    class ItemCompraNaoEncontradoError extends Error {
        constructor() {
            super('Item não encontrado para essa compra.');
            this.name = 'ItemCompraNaoEncontradoError';
        }
    }

    return {
        atualizarPorCompraId: jest.fn(),
        ItemCompraNaoEncontradoError
    };
});

const {
    atualizarPorCompraId,
    ItemCompraNaoEncontradoError
} = require('../../Backend/src/repositories/compraRepository');
const app = require('../../Backend/src/app');

const endpoint = '/api/compras/2/items/1';

describe('PATCH /api/compras/:compraId/items/:itemId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('retorna 400 para compraId inválido antes de consultar o repositório', async () => {
        const response = await request(app)
            .patch('/api/compras/0/items/1')
            .send({ quantidade: 2 });

        expect(response.status).toBe(400);
        expect(response.body.erro).toBe(
            'compraId deve ser um inteiro positivo.'
        );
        expect(atualizarPorCompraId).not.toHaveBeenCalled();
    });

    test('retorna 400 para itemId inválido antes de consultar o repositório', async () => {
        const response = await request(app)
            .patch('/api/compras/2/items/abc')
            .send({ quantidade: 2 });

        expect(response.status).toBe(400);
        expect(response.body.erro).toBe(
            'itemId deve ser um inteiro positivo.'
        );
        expect(atualizarPorCompraId).not.toHaveBeenCalled();
    });

    test('retorna 400 quando nenhum campo de atualização é enviado', async () => {
        const response = await request(app)
            .patch(endpoint)
            .send({});

        expect(response.status).toBe(400);
        expect(atualizarPorCompraId).not.toHaveBeenCalled();
    });

    test('retorna 400 quando um campo desconhecido é enviado', async () => {
        const response = await request(app)
            .patch(endpoint)
            .send({ preco: 10 });

        expect(response.status).toBe(400);
        expect(response.body.erro).toBe('Campos não permitidos: preco.');
        expect(atualizarPorCompraId).not.toHaveBeenCalled();
    });

    test.each([
        ['quantidade textual', { quantidade: '2' }],
        ['quantidade igual a zero', { quantidade: 0 }],
        ['quantidade negativa', { quantidade: -1 }],
        ['valor unitário textual', { valor_unitario: '10.50' }],
        ['valor unitário negativo', { valor_unitario: -0.01 }],
        ['nome não textual', { nome_item: 10 }],
        ['nome vazio', { nome_item: '   ' }],
        ['nome acima do limite', { nome_item: 'a'.repeat(101) }],
        ['unidade não textual', { unidade_de_medida: 1 }],
        ['unidade vazia', { unidade_de_medida: '   ' }],
        ['unidade acima do limite', { unidade_de_medida: 'a'.repeat(21) }],
        ['validade não textual', { validade_estimada: 20260919 }],
        ['validade inexistente', { validade_estimada: '2026-02-29' }],
        ['validade fora do formato ISO', { validade_estimada: '19/09/2026' }]
    ])('rejeita %s antes de consultar o repositório', async (_caseName, body) => {
        const response = await request(app)
            .patch(endpoint)
            .send(body);

        expect(response.status).toBe(400);
        expect(atualizarPorCompraId).not.toHaveBeenCalled();
    });

    test('aceita os tipos válidos e converte os IDs para números', async () => {
        const resultado = {
            item: { id: 1, quantidade: '2.50' },
            compra: { id: 2, valor_total: '25.00' }
        };
        atualizarPorCompraId.mockResolvedValue(resultado);

        const response = await request(app)
            .patch(endpoint)
            .send({
                quantidade: 2.5,
                valor_unitario: 10,
                nome_item: 'Arroz',
                unidade_de_medida: 'kg',
                validade_estimada: '2026-09-19'
            });

        expect(response.status).toBe(200);
        expect(atualizarPorCompraId).toHaveBeenCalledWith(1, 2, {
            quantidade: 2.5,
            valor_unitario: 10,
            nome_item: 'Arroz',
            unidade_de_medida: 'kg',
            validade_estimada: '2026-09-19'
        });
        expect(response.body.data).toEqual(resultado);
    });

    test('aceita null para remover a validade estimada', async () => {
        atualizarPorCompraId.mockResolvedValue({
            item: { id: 1, validade_estimada: null },
            compra: { id: 2, valor_total: '10.00' }
        });

        const response = await request(app)
            .patch(endpoint)
            .send({ validade_estimada: null });

        expect(response.status).toBe(200);
        expect(atualizarPorCompraId).toHaveBeenCalledWith(1, 2, {
            quantidade: undefined,
            valor_unitario: undefined,
            nome_item: undefined,
            unidade_de_medida: undefined,
            validade_estimada: null
        });
    });

    test('retorna 404 quando o item não pertence à compra', async () => {
        atualizarPorCompraId.mockRejectedValue(
            new ItemCompraNaoEncontradoError()
        );

        const response = await request(app)
            .patch(endpoint)
            .send({ quantidade: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            erro: 'Item não encontrado para essa compra.'
        });
    });

    test('mantém 500 para outras falhas do repositório', async () => {
        atualizarPorCompraId.mockRejectedValue(
            new Error('Falha de conexão')
        );

        const response = await request(app)
            .patch(endpoint)
            .send({ quantidade: 2 });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            erro: 'Erro ao atualizar itens da compra no banco'
        });
    });
});
