jest.mock('../../Backend/src/repositories/userRepository', () => ({ findUserDataById: jest.fn() }));
const compraUser = require('../../Backend/src/middleware/compraUser');
const { findUserDataById } = require('../../Backend/src/repositories/userRepository');

beforeEach(() => {
    jest.clearAllMocks();
    findUserDataById.mockResolvedValue({ id: 42, username: 'teste' });
});

function response() {
    return { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
}

test.each(['GET', 'POST', 'PATCH', 'DELETE'])('%s usa a sessão e ignora usuario_id da consulta e do corpo', async (method) => {
    const req = { method, session: { userId: 42 }, query: { usuario_id: '1' }, body: { usuario_id: 7 } };
    const next = jest.fn();
    await compraUser(req, response(), next);
    expect(req.user.id).toBe(42);
    expect(findUserDataById).toHaveBeenCalledWith(42);
    expect(next).toHaveBeenCalledTimes(1);
});

test.each([undefined, null, 0, -1, '42'])('identificação %s no corpo não cria uma sessão', async (usuario_id) => {
    const req = { method: 'POST', body: { usuario_id } };
    const res = response();
    const next = jest.fn();
    await compraUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(findUserDataById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
});
