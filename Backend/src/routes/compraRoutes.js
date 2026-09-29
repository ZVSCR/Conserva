const express = require('express');
const compraRouter = express.Router();
const {
    listarCompras,
    listarItensPorCompra,
    atualizarCompra,
    atualizarItensPorCompra,
    atualizarInstanciasPorCompra,
    createCompraVaziaController,
    adicionaItensACompra,
    createCompra,
    apagarCompra
} = require('../controllers/compraController');

compraRouter.post('/', createCompra)

compraRouter.route('/novo')
    .post(createCompraVaziaController);

compraRouter.route('/')
    .get(listarCompras);

compraRouter.route('/:compraId')
    .get(listarItensPorCompra)
    .patch(atualizarCompra)
    .delete(apagarCompra);

compraRouter.route('/:compraId/items/:itemId')
    .patch(atualizarItensPorCompra);

compraRouter.route('/:compraId/items')
    .post(adicionaItensACompra)
    .patch(atualizarInstanciasPorCompra);

module.exports = compraRouter;
