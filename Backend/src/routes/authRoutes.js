// Mapeia rotas finais para cada função importante na autenticação

const express = require('express');

const {
    register,
    login
} = require('../controllers/authController');

// const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;