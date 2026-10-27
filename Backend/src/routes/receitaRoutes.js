const express = require('express');
const receitaRouter = express.Router();

const receitaUser = require('../middleware/receitaUser');

const {
    createReceita,
    listarPreparos,
    getGastoPorReceita,
    getGastoReceita,
    verificarReceita, 
    prepararReceita,
    listReceitas,
    getReceitaById,
    apagarReceita,
    patchReceitaById,
} = require('../controllers/receitaController');

receitaRouter.use(receitaUser);
receitaRouter.get('/gastos', getGastoPorReceita);
receitaRouter.get('/preparadas', listarPreparos);

receitaRouter.route('/')
    .post(createReceita)
    .get(listReceitas)

receitaRouter.route('/:receitaId/disponibilidade')
    .get(verificarReceita);

receitaRouter.route('/:receitaId/preparar')
    .post(prepararReceita);

receitaRouter.route('/:id')
    .get(getReceitaById)
    .patch(patchReceitaById);

receitaRouter.route('/:receitaId')
    .delete(apagarReceita);

// Gasto de uma receita, detalhado por preparo
receitaRouter.route('/:id/gasto')
    .get(getGastoReceita);

module.exports = receitaRouter;
