const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, patchIngredienteById } = require('../controllers/ingredienteController');
const requireAuth = require('../middleware/requireAuth');

// Operação desativada por decisão do grupo, antes de qualquer acesso ao banco.
ingredienteRouter.delete('/:id', (_req, res) => res.status(403).json({
    error: 'A exclusão de ingredientes está indisponível.'
}));
ingredienteRouter.use(requireAuth);

ingredienteRouter.route('/')
    .post(createIngrediente);

ingredienteRouter.route('/:id')
    .patch(patchIngredienteById);

module.exports = ingredienteRouter;
