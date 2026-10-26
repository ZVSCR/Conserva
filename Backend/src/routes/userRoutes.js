const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

userRouter.use(requireAuth);

userRouter.route('/gastos')
    .get(userController.listarGastosUsuarios);

userRouter.route('/me')
    .get(userController.getUserData)
    .patch(userController.updateUserData);

userRouter.route('/me/preferences')
    .get(userController.getUserPreferences)
    .patch(userController.updateUserPreferences);

module.exports = userRouter;
