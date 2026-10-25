const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, deleteIngrediente } = require('../controllers/ingredienteController');
const ingredienteUser = require('../middleware/ingredienteUser');

ingredienteRouter.post('/', createIngrediente);
ingredienteRouter.delete('/:id', ingredienteUser, deleteIngrediente);

module.exports = ingredienteRouter;
