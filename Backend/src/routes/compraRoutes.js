const express = require('express');
const compraRouter = express.Router();
const {
    atualizarCompra,
    atualizarItensPorCompra,
    atualizarInstanciasPorCompra
} = require('../controllers/compraController');

compraRouter.route('/:compraId')
    .patch(atualizarCompra);

compraRouter.route('/:compraId/items/:itemId')
    .patch(atualizarItensPorCompra);

compraRouter.route('/:compraId/items')
    .patch(atualizarInstanciasPorCompra);

module.exports = compraRouter;
