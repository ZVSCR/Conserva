const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');

const mockAuth = (req, res, next) => {
  req.user = {
    id: 1,
    username: 'dev',
    email: 'dev@exemplo.com',
    tipo: 'dev',
    notify_push: true,
    notify_email: true,
    is_dark_theme: false
  };

  next();
};

userRouter.route('/gastos')
    .get(userController.listarGastosUsuarios);
    
userRouter.route('/me')
    .all(mockAuth)
    .patch(userController.updateUserData);

userRouter.route('/me/preferences')
    .all(mockAuth)
    .get(userController.getUserPreferences)
    .patch(userController.updateUserPreferences);

module.exports = userRouter;