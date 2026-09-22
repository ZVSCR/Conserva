const express = require('express');
const compraRouter = express.Router();
const {
    atualizarCompra,
    atualizarItensPorCompra
} = require('../controllers/compraController');

compraRouter.route('/:compraId')
    .patch(atualizarCompra);

compraRouter.route('/:compraId/items/:itemId')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;
