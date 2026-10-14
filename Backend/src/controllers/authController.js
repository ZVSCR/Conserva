const bcrypt = require('bcrypt');
const db = require('../config/database');

const {
    validateRegister,
    validateLogin
} = require('../middleware/authValidator');

const {
    registerService,
    loginService
} = require('../services/authService');

async function register(req, res) {

    try {

        // Valida campos de usuário preenchidos
        const {
            isValid,
            errors
        } = validateRegister(req.body);

        // Retorna status 400 em caso de invalidez
        if (!isValid) {
            return res.status(400).json({
                errors
            });
        }

        // Chama serviço para registrar novo usuário
        const usuarioCriado = await registerService(req.body);

        // Retorna status 201 se registro foi bem sucedido
        return res.status(201).json({
            message: 'Usuário registrado com sucesso.',
            user: usuarioCriado[0]
        });

    } catch (error) {

        // Violação de unicidade de identificadores
        if (error.code === '409') {
            return res.status(409).json({
                error: 'Username ou email já cadastrados.'
            });
        }

        console.error('Erro em authController.register:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

async function login(req, res) {

    try {

        const {
            isValid,
            errors
        } = validateLogin(req.body);

        if (!isValid) {
            return res.status(400).json({
                errors
            });
        }

        // Chama serviço para efetuar login
        const userFound = await loginService(req.body);

        // Retorna status 200 se registro foi bem sucedido
        return res.status(200).json({
            message: 'Login efetuado! Seja bem vindo!',
            user: userFound
        });

    } catch (error) {

        if (error.code === '401') {
            return res.status(401).json({
                error: 'Identificador ou senha inválidos.'
            });
        }

        console.error('Erro em authController.login:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });

    }
}

module.exports = {
    register,
    login
};

// Primeiro controller: ~240 LOC
// Novo controller: 100 LOC