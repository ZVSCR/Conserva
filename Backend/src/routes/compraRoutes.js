const express = require('express');
const compraRouter = express.Router();
const { atualizarItensPorCompra } = require('../controllers/itemController');

compraRouter.route('/compra/:compraId/item/:id')
    .patch(atualizarItensPorCompra);

module.exports = compraRouter;