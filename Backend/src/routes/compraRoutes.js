const express = require('express');
const compraRouter = express.Router();
const {
    atualizarItensPorCompra,
    createCompra
} = require('../controllers/compraController');

compraRouter.post('/', createCompra)

// /compra/ quando /api/compras/ existe é redundância
compraRouter.route('/:compraId/item/:itemId')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;