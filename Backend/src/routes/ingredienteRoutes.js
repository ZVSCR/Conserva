const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente } = require('../controllers/ingredienteController');

ingredienteRouter.post('/', createIngrediente);

module.exports = ingredienteRouter;
