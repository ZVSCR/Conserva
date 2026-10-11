const express = require('express');
const receitaRouter = express.Router();

const {
    createReceita, verificarReceita, prepararReceita
} = require('../controllers/receitaController');

receitaRouter.route('/')
    .post(createReceita);
// .get()
// .patch()
// .delete();
// Adicionar somente quando funções forem implementadas

receitaRouter.route('/:receitaId/disponibilidade')
    .get(verificarReceita);

receitaRouter.route('/:receitaId/preparar')
    .post(prepararReceita);

module.exports = receitaRouter;