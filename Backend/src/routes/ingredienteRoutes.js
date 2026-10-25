const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, deleteIngrediente } = require('../controllers/ingredienteController');
const ingredienteUser = require('../middleware/ingredienteUser');

ingredienteRouter.route('/')
    .post(createIngrediente);

ingredienteRouter.route('/:id')
    .delete(ingredienteUser, deleteIngrediente);

module.exports = ingredienteRouter;
