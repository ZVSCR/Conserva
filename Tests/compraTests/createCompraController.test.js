jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(42));

const request = require('supertest');

jest.mock('../../Backend/src/config/database.js', () => ({}));
jest.mock('../../Backend/src/repositories/compraRepository.js', () => ({
    atualizarPorCompraId: jest.fn(),
    createCompraRepo: jest.fn()
}));
jest.mock('../../Backend/src/services/compraService.js', () => ({
    createCompraService: jest.fn()
}));

const app = require('../../Backend/src/app');
const { createCompraService } = require('../../Backend/src/services/compraService');

const compraValida = {
    usuario_id: 42,
    data_compra: '2026-09-20',
    estabelecimento: 'Mercado Central',
    itens: [{
        nome_item: 'Arroz',
        quantidade: 2,
        unidade_de_medida: 'kg',
        valor_unitario: 8.5,
        validade_estimada: '2027-03-01'
    }]
};

beforeEach(() => {
    jest.clearAllMocks();
});

test('cria compra com o usuário autenticado', async () => {
    createCompraService.mockResolvedValue({ id: 123 });

    const response = await request(app)
        .post('/api/compras')
        .send(compraValida);

    expect(response.status).toBe(201);
    expect(response.body.compra).toBe(123);
    expect(createCompraService).toHaveBeenCalledWith(42, compraValida);
});

test.each([undefined, null, 0, -1, 1.5, '42'])(
    'usuario_id %s não substitui a sessão',
    async (usuario_id) => {
        createCompraService.mockResolvedValue({ id: 123 });
        const response = await request(app)
            .post('/api/compras')
            .send({ ...compraValida, usuario_id });

        expect(response.status).toBe(201);
        expect(createCompraService).toHaveBeenCalledWith(42, { ...compraValida, usuario_id });
    }
);

test('não chama o serviço se os itens da compra forem inválidos', async () => {
    const response = await request(app)
        .post('/api/compras')
        .send({ ...compraValida, itens: [] });

    expect(response.status).toBe(400);
    expect(createCompraService).not.toHaveBeenCalled();
});

test('responde com erro interno quando o serviço falha', async () => {
    createCompraService.mockRejectedValue(new Error('Falha simulada'));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
        const response = await request(app)
            .post('/api/compras')
            .send(compraValida);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Erro interno do servidor.');
    } finally {
        consoleSpy.mockRestore();
    }
});
