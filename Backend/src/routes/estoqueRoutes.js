const express = require('express');
const estoqueRouter = express.Router();
const { listarEstoque, atualizarQuantidadeItem, listarGastosEstoque, listarItensEstoque, listarConsumo } = require('../controllers/estoqueController');

const estoqueUser = require('../middleware/estoqueUser');

estoqueRouter.use(estoqueUser);

estoqueRouter.route('/')
    .get(listarEstoque);

estoqueRouter.route('/gastos')
    .get(listarGastosEstoque);

estoqueRouter.route('/consumo')
    .get(listarConsumo);
    
estoqueRouter.route('/itens')
    .get(listarItensEstoque);

estoqueRouter.route('/:itemId')
    .patch(atualizarQuantidadeItem);

module.exports = estoqueRouter;