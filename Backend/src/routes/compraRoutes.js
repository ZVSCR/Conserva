const express = require('express');
const compraRouter = express.Router();
const { listarItens, listarPorId, atualizarItem, apagarId, criarItemHandler } = require('../controllers/itemController');

compraRouter.route('/')
    .get(listarItens)
    .post(criarItemHandler);

compraRouter.route('/:id')
    .get(listarPorId)
    .patch(atualizarItem)
    .delete(apagarId);

module.exports = itemRouter;