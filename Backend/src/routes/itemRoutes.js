const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId, atualizarItem, apagarId, criarItemHandler, listarItensGastos } = require('../controllers/itemController');

const requireAuth = require('../middleware/requireAuth');
itemRouter.use(requireAuth);

// Nova rota específica para os gastos do usuário logado
itemRouter.route('/gastos')
    .get(listarItensGastos);

itemRouter.route('/')
    .get(listarItens)
    .post(criarItemHandler);

itemRouter.route('/:id')
    .get(listarPorId)
    .patch(atualizarItem)
    .delete(apagarId);

module.exports = itemRouter;
