// Mapeia rotas finais para cada função importante na autenticação

const express = require('express');

const {
    register,
    login,
    logout
} = require('../controllers/authController');

const router = express.Router();
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
