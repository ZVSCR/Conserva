const express = require('express');
const receitaRouter = express.Router();

const {
    createReceita
} = require('../controllers/receitaController');

receitaRouter.route('/')
    .post(createReceita);
// .get()
// .patch()
// .delete();
// Adicionar somente quando funções forem implementadas

module.exports = receitaRouter;