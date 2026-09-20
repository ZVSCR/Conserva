const express = require('express');
const compraRouter = express.Router();
const { atualizarItensPorCompra } = require('../controllers/compraController');

compraRouter.route('/:compraId/items/:itemId')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;
