const compraUser = require('../../Backend/src/middleware/compraUser');

test.each(['GET', 'PATCH', 'DELETE'])('%s uses the supplied query ID', (method) => {
    const req = { method, query: { usuario_id: '42' } };
    const next = jest.fn();
    compraUser(req, {}, next);
    expect(req.compraUsuarioId).toBe(42);
    expect(next).toHaveBeenCalledTimes(1);
});

test('POST uses the body ID', () => {
    const req = { method: 'POST', body: { usuario_id: 42 }, query: { usuario_id: '1' } };
    const next = jest.fn();
    compraUser(req, {}, next);
    expect(req.compraUsuarioId).toBe(42);
    expect(next).toHaveBeenCalledTimes(1);
});

test.each([undefined, null, 0, -1, 1.5, '42', {}, []])('POST rejects invalid ID %s', (usuario_id) => {
    const req = { method: 'POST', body: { usuario_id } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    compraUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
});

test('rejects repeated query IDs', () => {
    const req = { method: 'GET', query: { usuario_id: ['7', '42'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    compraUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
});
