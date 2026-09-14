const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId, atualizarItem, apagarId } = require('../controllers/itemController');

itemRouter.route('/')
    .get(listarItens);

itemRouter.route('/:id')
    .get(listarPorId)
    .patch(atualizarItem)
    .delete(apagarId);

module.exports = itemRouter;