const express = require('express');
const ingredienteRouter = express.Router();
const { createIngrediente, patchIngredienteById, deleteIngrediente, listIngredientes } = require('../controllers/ingredienteController');
const ingredienteUser = require('../middleware/ingredienteUser');
const requireAuth = require('../middleware/requireAuth');

ingredienteRouter.get('/', requireAuth, listIngredientes);
ingredienteRouter.use(ingredienteUser);

ingredienteRouter.route('/')
    .post(createIngrediente);

ingredienteRouter.route('/:id')
    .patch(patchIngredienteById)
    .delete(deleteIngrediente);

module.exports = ingredienteRouter;
