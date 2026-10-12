const express = require('express');
const receitaRouter = express.Router();

const autenticar = require('../middleware/mockAuth');
//Quando deixar de usar o mockAuth, basta trocar por require('../middleware/requireAuth');

const {
    createReceita, 
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
    .get(autenticar, verificarReceita);

receitaRouter.route('/:receitaId/preparar')
    .post(autenticar, prepararReceita);

receitaRouter.route('/:id')
    .get(getReceitaById)
    .delete(deleteReceita)
    .patch();

module.exports = receitaRouter;