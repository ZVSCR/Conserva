const request = require('supertest');

jest.mock('../../Backend/src/config/database.js', () => {
    const sql = jest.fn();
    sql.query = jest.fn();
    sql.transaction = jest.fn();
    return sql;
});

jest.mock('../../Backend/src/repositories/compraRepository.js', () => {
    class CompraNaoEncontradaError extends Error {
        constructor() {
            super('Compra não encontrada.');
            this.name = 'CompraNaoEncontradaError';
        }
    }

    class ItemCompraNaoEncontradoError extends Error {
        constructor() {
            super('Item não encontrado para essa compra.');
            this.name = 'ItemCompraNaoEncontradoError';
        }
    }

    return {
        listarComprasUsuario: jest.fn(),
        listarCompraPorId: jest.fn(),
        atualizarCompraPorId: jest.fn(),
        atualizarPorCompraId: jest.fn(),
        CompraNaoEncontradaError,
        ItemCompraNaoEncontradoError
    };
});

const {
    listarComprasUsuario,
    listarCompraPorId,
    atualizarCompraPorId,
    atualizarPorCompraId,
    CompraNaoEncontradaError,
    ItemCompraNaoEncontradoError
} = require('../../Backend/src/repositories/compraRepository');
const app = require('../../Backend/src/app');

const endpoint = '/api/compras/2/items/1';
const compraEndpoint = '/api/compras/2';
const listaComprasEndpoint = '/api/compras';

// =============================================================================
// READ
describe('GET /api/compras', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('retorna 500 para erro em compraRepository', async () => {
        listarComprasUsuario.mockRejectedValue(
            new Error('Falha de conexão.')
        );

        const response = await request(app)
            .get(listaComprasEndpoint);

        expect(response.status).toBe(500);
        expect(response.body.erro).toBe(
            'Erro no acesso ao repositorio.'
        );
        expect(listarComprasUsuario).toHaveBeenCalled();
    });

    test('retorna 200 para lista vazia de compras', async () => {
        const compras = [];
        listarComprasUsuario.mockResolvedValue(compras);

        const response = await request(app)
            .get(listaComprasEndpoint);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(compras);
        expect(listarComprasUsuario).toHaveBeenCalled();
    });

    test('retorna 200 para lista com compras', async () => {
        const compras = [
            {
                id: 2,
                usuario_id: 1,
                data_compra: '2026-09-19T14:30:00.000Z',
                valor_total: 11.0,
                estabelecimento: 'Padaria do Zé'
            },
            {
                id: 4,
                usuario_id: 1,
                data_compra: '2026-10-06T19:23:00.000Z',
                valor_total: 165.0,
                estabelecimento: 'Atacadao'
            }
        ];
        listarComprasUsuario.mockResolvedValue(compras);

        const response = await request(app)
            .get(listaComprasEndpoint);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(compras);
        expect(listarComprasUsuario).toHaveBeenCalled();
    })
});

describe('GET /api/compras/:compraId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('retorna 500 para erro em compraRepository', async () => {
        listarCompraPorId.mockRejectedValue(
            new Error('Falha de conexão.')
        );

        const response = await request(app)
            .get(compraEndpoint);

        expect(response.status).toBe(500);
        expect(response.body.erro).toBe(
            'Erro no acesso ao repositorio.'
        );
        expect(listarCompraPorId).toHaveBeenCalled();
    });
    
    test('retorna 400 para compraID invalido antes de consultar o repositorio', async () => {
        const response = await request(app)
            .get('/api/compras/abc');

        expect(response.status).toBe(400);
        expect(response.body.erro).toBe(
            'compraId deve ser um inteiro positivo.'
        );
        expect(listarCompraPorId).not.toHaveBeenCalled();
    });
    
    test('retorna 404 para compra nao existente', async () => {
        listarCompraPorId.mockRejectedValue(
            new CompraNaoEncontradaError()
        );

        const response = await request(app)
            .get(compraEndpoint);

        expect(response.status).toBe(404);
        expect(response.body.erro).toBe(
            'Compra nao existe.'
        );
        expect(listarCompraPorId).toHaveBeenCalled();
    });
    
    test('retorna 200 para compra existente', async () => {
        const compra = {
                id: 2,
                usuario_id: 1,
                data_compra: '2026-10-06T19:23:00.000Z',
                valor_total: 165.0,
                estabelecimento: 'Atacadao'
        };
        listarCompraPorId.mockResolvedValue(compra);

        const response = await request(app)
            .get(compraEndpoint);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(compra);
        expect(listarCompraPorId).toHaveBeenCalledWith(2);
    });
});
// =============================================================================

// =============================================================================
// UPDATE
describe('PATCH /api/compras/:compraId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('retorna 400 para compraId inválido antes de consultar o repositório', async () => {
        const response = await request(app)
            .patch('/api/compras/abc')
            .send({ estabelecimento: 'Mercado Central' });

        expect(response.status).toBe(400);
        expect(response.body.erro).toBe(
            'compraId deve ser um inteiro positivo.'
        );
        expect(atualizarCompraPorId).not.toHaveBeenCalled();
    });

    test('retorna 400 quando nenhum campo é enviado', async () => {
        const response = await request(app)
            .patch(compraEndpoint)
            .send({});

        expect(response.status).toBe(400);
        expect(atualizarCompraPorId).not.toHaveBeenCalled();
    });

    test('retorna 400 para campos desconhecidos', async () => {
        const response = await request(app)
            .patch(compraEndpoint)
            .send({ valor_total: 100 });

        expect(response.status).toBe(400);
        expect(response.body.erro).toBe(
            'Campos não permitidos: valor_total.'
        );
        expect(atualizarCompraPorId).not.toHaveBeenCalled();
    });

    test.each([
        ['data não textual', { data_compra: 20260919 }],
        ['data inexistente', { data_compra: '2026-02-29' }],
        ['data fora do padrão ISO', { data_compra: '19/09/2026' }],
        ['horário inexistente', { data_compra: '2026-09-19T25:00:00' }],
        ['estabelecimento não textual', { estabelecimento: 10 }],
        ['estabelecimento vazio', { estabelecimento: '   ' }],
        ['estabelecimento acima do limite', { estabelecimento: 'a'.repeat(51) }]
    ])('rejeita %s antes de consultar o repositório', async (_caseName, body) => {
        const response = await request(app)
            .patch(compraEndpoint)
            .send(body);

        expect(response.status).toBe(400);
        expect(atualizarCompraPorId).not.toHaveBeenCalled();
    });

    test('atualiza parcialmente data e estabelecimento', async () => {
        const compra = {
            id: 2,
            data_compra: '2026-09-19T14:30:00.000Z',
            estabelecimento: 'Mercado Central'
        };
        atualizarCompraPorId.mockResolvedValue(compra);

        const response = await request(app)
            .patch(compraEndpoint)
            .send({
                data_compra: '2026-09-19T14:30:00.000Z',
                estabelecimento: 'Mercado Central'
            });

        expect(response.status).toBe(200);
        expect(atualizarCompraPorId).toHaveBeenCalledWith(2, {
            data_compra: '2026-09-19T14:30:00.000Z',
            estabelecimento: 'Mercado Central'
        });
        expect(response.body.data).toEqual(compra);
    });

    test('aceita uma data sem horário e null para remover o estabelecimento', async () => {
        atualizarCompraPorId.mockResolvedValue({
            id: 2,
            data_compra: '2026-09-19',
            estabelecimento: null
        });

        const response = await request(app)
            .patch(compraEndpoint)
            .send({
                data_compra: '2026-09-19',
                estabelecimento: null
            });

        expect(response.status).toBe(200);
        expect(atualizarCompraPorId).toHaveBeenCalledWith(2, {
            data_compra: '2026-09-19',
            estabelecimento: null
        });
    });

    test('retorna 404 quando a compra não existe', async () => {
        atualizarCompraPorId.mockRejectedValue(
            new CompraNaoEncontradaError()
        );

        const response = await request(app)
            .patch(compraEndpoint)
            .send({ estabelecimento: 'Mercado Central' });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            erro: 'Compra não encontrada.'
        });
    });

    test('mantém 500 para outras falhas do repositório', async () => {
        atualizarCompraPorId.mockRejectedValue(
            new Error('Falha de conexão')
        );

        const response = await request(app)
            .patch(compraEndpoint)
            .send({ estabelecimento: 'Mercado Central' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            erro: 'Erro ao atualizar compra no banco'
        });
    });
});

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
// =============================================================================
