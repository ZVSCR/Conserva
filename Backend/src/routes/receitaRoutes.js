const express = require('express');
const receitaRouter = express.Router();

const receitaUser = require('../middleware/receitaUser');

const {
    createReceita,
    createReceitaPreparada,
    getGastoPorReceita,
    getGastoReceita,
    verificarReceita, 
    prepararReceita,
    listReceitas,
    getReceitaById,
    deleteReceita,
    patchReceitaById,
} = require('../controllers/receitaController');

receitaRouter.route('/')
    .post(createReceita)
    .get(listReceitas)

receitaRouter.route('/:receitaId/disponibilidade')
    .get(receitaUser, verificarReceita);

receitaRouter.route('/:receitaId/preparar')
    .post(receitaUser, prepararReceita);

receitaRouter.route('/:id')
    .get(getReceitaById)
    .delete(deleteReceita)
    .patch(patchReceitaById);

// Gasto acumulado de todas as receitas (rota fixa antes das rotas com :id)
receitaRouter.route('/gastos')
    .get(getGastoPorReceita);

// Gasto de uma receita, detalhado por preparo
receitaRouter.route('/:id/gasto')
    .get(getGastoReceita);

module.exports = receitaRouter;
