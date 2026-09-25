const express = require('express');
const estoqueRouter = express.Router();
const { listarEstoque, atualizarQuantidadeItem, listarGastosEstoque, listarItensEstoque } = require('../controllers/estoqueController');

const mockAuth = (req, res, next) => {
  req.user = { id: 1 };
  next();
};
estoqueRouter.use(mockAuth);

estoqueRouter.route('/')
    .get(listarEstoque);

estoqueRouter.route('/gastos')
    .get(listarGastosEstoque);

estoqueRouter.route('/consumo')
    .get(listarConsumo);

estoqueRouter.route('/:itemId')
    .patch(atualizarQuantidadeItem);

estoqueRouter.route('/itens')
    .get(listarItensEstoque);

module.exports = estoqueRouter;