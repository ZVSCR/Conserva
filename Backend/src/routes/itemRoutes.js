const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId, apagarId } = require('../controllers/itemController');

itemRouter.route('/')
    .get(listarItens);

itemRouter.route('/:id')
    .get(listarPorId)
    .delete(apagarId);

module.exports = itemRouter;