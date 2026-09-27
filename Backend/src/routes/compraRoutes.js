const express = require('express');
const compraRouter = express.Router();
const {
    listarCompras,
    listarItensPorCompra,
    atualizarCompra,
    atualizarItensPorCompra,
    createCompra,
    apagarCompra
} = require('../controllers/compraController');

compraRouter.post('/', createCompra)

compraRouter.route('/')
    .get(listarCompras);

compraRouter.route('/:compraId')
    .get(listarItensPorCompra)
    .patch(atualizarCompra)
    .delete(apagarCompra);

compraRouter.route('/:compraId/items/:itemId')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;
