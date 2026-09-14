const express = require('express');
const estoqueRouter = express.Router();
const { listarEstoque, atualizarQuantidadeItem } = require('../controllers/estoqueController');

estoqueRouter.route('/')
    .get(listarEstoque);

estoqueRouter.route('/:id')
    .patch(atualizarQuantidadeItem);

module.exports = estoqueRouter;