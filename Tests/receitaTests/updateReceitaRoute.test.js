jest.mock('../../Backend/src/controllers/receitaController.js', () => ({
    createReceita: (_req, res) => res.sendStatus(501),
    verificarReceita: (_req, res) => res.sendStatus(501),
    prepararReceita: (_req, res) => res.sendStatus(501),
    listReceitas: (_req, res) => res.sendStatus(501),
    getGastoPorReceita: (_req, res) => res.sendStatus(501),
    getGastoReceita: (_req, res) => res.sendStatus(501),
    getReceitaById: (_req, res) => res.sendStatus(501),
    deleteReceita: (_req, res) => res.sendStatus(501),
    patchReceitaById: jest.fn()
}));

const receitaRouter = require('../../Backend/src/routes/receitaRoutes');
const { patchReceitaById } = require('../../Backend/src/controllers/receitaController');

test('PATCH /:id está ligado ao controlador de atualização', () => {
    const rota = receitaRouter.stack.find(layer => layer.route?.path === '/:id').route;
    const patch = rota.stack.find(layer => layer.method === 'patch');

    expect(patch.handle).toBe(patchReceitaById);
});
