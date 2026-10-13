const express = require('express');
const receitaRouter = express.Router();

const {
    createReceita,
    getGastoPorReceita,
    getGastoReceita
} = require('../controllers/receitaController');

receitaRouter.route('/')
    .post(createReceita);
// .get()
// .patch()
// .delete();
// Adicionar somente quando funções forem implementadas

// Gasto acumulado de todas as receitas (rota fixa antes das rotas com :id)
receitaRouter.route('/gastos')
    .get(getGastoPorReceita);

// Gasto de uma receita, detalhado por preparo
receitaRouter.route('/:id/gasto')
    .get(getGastoReceita);

module.exports = receitaRouter;