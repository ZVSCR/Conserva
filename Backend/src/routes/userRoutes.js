const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

// Rota de cadastro (POST /api/users)
userRouter.post('/', userController.registerUser);

// Dados do usuário autenticado
userRouter.route('/me')
    .get(requireAuth, userController.getUserData)
    .patch(requireAuth, userController.updateUserData);

// Rota de preferências (GET e PATCH /api/users/me/preferences)
userRouter.route('/me/preferences')
    .get(requireAuth, userController.getUserPreferences)
    .patch(requireAuth, userController.updateUserPreferences);

module.exports = userRouter;
