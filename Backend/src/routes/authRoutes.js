// Função: mapear URLs para as funções

const express = require('express');

const {
    register,
    login,
    logout,
    getCurrentUser
} = require('../controllers/authController');

const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/me', getCurrentUser);

module.exports = router;