const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId, atualizarItem, apagarId, criarItemHandler } = require('../controllers/itemController');

itemRouter.route('/')
    .get(listarItens)
    .post(criarItemHandler);

itemRouter.route('/:id')
    .get(listarPorId)
    .patch(atualizarItem)
    .delete(apagarId);

module.exports = itemRouter;