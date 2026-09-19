const express = require('express');
const compraRouter = express.Router();
const { listarItens, listarPorId, atualizarItem, apagarId, criarItemHandler } = require('../controllers/itemController');

compraRouter.route('/')

compraRouter.route('/:id')

module.exports = compraRouter;