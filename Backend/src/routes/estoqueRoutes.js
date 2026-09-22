const express = require('express');
const estoqueRouter = express.Router();
const { listarEstoque, atualizarQuantidadeItem, listarGastosEstoque } = require('../controllers/estoqueController');

const mockAuth = (req, res, next) => {
  req.user = { id: 1 };
  next();
};
estoqueRouter.use(mockAuth);

estoqueRouter.route('/')
    .get(listarEstoque);

estoqueRouter.route('/gastos')
    .get(listarGastosEstoque);

estoqueRouter.route('/:itemId')
    .patch(atualizarQuantidadeItem);

module.exports = estoqueRouter;