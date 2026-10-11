const express = require('express');
const receitaRouter = express.Router();

const autenticar = require('../middleware/mockAuth');
//Quando deixar de usar o mockAuth, basta trocar por require('../middleware/requireAuth');

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
    .get(autenticar, verificarReceita);

receitaRouter.route('/:receitaId/preparar')
    .post(autenticar, prepararReceita);

module.exports = receitaRouter;