const express = require('express');
const compraRouter = express.Router();
const { atualizarItensPorCompra } = require('../controllers/itemController');

itemRouter.route('/compra/:compraId/item/:id')
    .patch(atualizarItem);
    
module.exports = compraRouter;