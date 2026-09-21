const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId, atualizarItem, apagarId, criarItemHandler, listarItensGastos } = require('../controllers/itemController');

// Simulação de autenticação (idealmente, mova isso para um arquivo na pasta middlewares)
const mockAuth = (req, res, next) => {
  req.user = { id: 1 };
  next();
};

// Nova rota específica para os gastos do usuário logado
itemRouter.route('/gastos')
    .all(mockAuth)
    .get(listarItensGastos);

itemRouter.route('/')
    .get(listarItens)
    .post(criarItemHandler);

itemRouter.route('/:id')
    .get(listarPorId)
    .patch(atualizarItem)
    .delete(apagarId);

module.exports = itemRouter;