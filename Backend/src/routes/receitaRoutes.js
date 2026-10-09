const express = require('express');
const receitaRouter = express.Router();

const {
    createReceita
} = require('../controllers/receitaController');

receitaRouter.route('/')
    .get()
    .patch()
    .post(createReceita)
    .delete();

module.exports = receitaRouter;