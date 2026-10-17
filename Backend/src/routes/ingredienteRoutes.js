const express = require('express');
const ingredienteRouter = express.Router();

const {
    createIngrediente
} = require('../controllers/ingredienteController');

ingredienteRouter.route('/')
    .post(createIngrediente);

module.exports = ingredienteRouter;