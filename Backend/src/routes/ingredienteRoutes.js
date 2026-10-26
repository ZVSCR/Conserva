const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, patchIngredienteById, deleteIngrediente } = require('../controllers/ingredienteController');
const ingredienteUser = require('../middleware/ingredienteUser');

ingredienteRouter.route('/')
    .post(createIngrediente);

ingredienteRouter.route('/:id')
    .patch(patchIngredienteById)
    .delete(ingredienteUser, deleteIngrediente);

module.exports = ingredienteRouter;
