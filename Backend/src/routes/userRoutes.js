const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

userRouter.use(requireAuth);

userRouter.get('/gastos', (req, res, next) => {
    if (req.user.id !== 1) return res.status(403).json({ error: 'Apenas o administrador pode consultar gastos gerais.' });
    next();
}, userController.listarGastosUsuarios);

userRouter.route('/me')
    .get(userController.getUserData)
    .patch(userController.updateUserData);

userRouter.route('/me/preferences')
    .get(userController.getUserPreferences)
    .patch(userController.updateUserPreferences);

module.exports = userRouter;
