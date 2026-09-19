const express = require('express');
const compraRouter = express.Router();
const { atualizarItensPorCompra } = require('../controllers/compraController');

compraRouter.route('/compra/:compraId/item/:itemId')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;