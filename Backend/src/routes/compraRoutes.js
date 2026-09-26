const express = require('express');
const compraRouter = express.Router();
const {
    listarCompras,
    listarItensPorCompra,
    atualizarCompra,
    atualizarItensPorCompra,
    apagarCompra
} = require('../controllers/compraController');

compraRouter.route('/')
    .get(listarCompras);

compraRouter.route('/:compraId')
    .get(listarItensPorCompra)
    .patch(atualizarCompra)
    .delete(apagarCompra);

compraRouter.route('/:compraId/items/:itemId')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;
