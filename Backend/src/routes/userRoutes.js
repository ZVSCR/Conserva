const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');

const mockAuth = (req, res, next) => {
  req.user = {
    id: 1,
    username: 'dev',
    email: 'dev@exemplo.com',
    tipo: 'dev',
    push_notifications: true,
    email_notifications: true,
    dark_theme: false
  };

  next();
};

userRouter.route('/me/preferences')
    .all(mockAuth)
    .get(userController.getUserPreferences)
    .patch(userController.updateUserPreferences);

module.exports = userRouter;