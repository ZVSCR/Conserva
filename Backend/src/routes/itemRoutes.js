const express = require('express');
const itemRouter = express.Router();
const { listarItens, listarPorId } = require('../controllers/itemController');

itemRouter.route('/')
    .get(listarItens);

itemRouter.route('/:id')
    .get(listarPorId);

module.exports = itemRouter;