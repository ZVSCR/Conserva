const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, patchIngredienteById } = require('../controllers/ingredienteController');

ingredienteRouter.post('/', createIngrediente);
ingredienteRouter.patch('/:id', patchIngredienteById);

module.exports = ingredienteRouter;
