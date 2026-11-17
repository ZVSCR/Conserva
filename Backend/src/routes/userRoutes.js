const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

const mockAuth = (req, res, next) => {
  req.user = { id: 1 };
  next();
};

// Rota de cadastro (POST /api/users)
userRouter.post('/', userController.registerUser);

// Rota de preferências (GET e PATCH /api/users/me/preferences)
userRouter.route('/me/preferences')
    .get(userController.getUserPreferences)
    .patch(userController.updateUserPreferences);

module.exports = userRouter;
