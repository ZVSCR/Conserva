const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId, apagarId, criarItemHandler} = require('../controllers/itemController');

itemRouter.route('/')
    .get(listarItens)
    .post(criarItemHandler);

itemRouter.route('/:id')
    .get(listarPorId)
    .delete(apagarId);

module.exports = itemRouter;