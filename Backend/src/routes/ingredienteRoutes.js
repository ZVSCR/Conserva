const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, patchIngredienteById } = require('../controllers/ingredienteController');

ingredienteRouter.route('/')
    .post(createIngrediente);
ingredienteRouter.route('/:id')
    .patch(patchIngredienteById);

module.exports = ingredienteRouter;
