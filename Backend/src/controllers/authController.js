const {
    validateRegister,
    validateLogin
} = require('../middleware/authValidator');

const {
    registerService,
    loginService
} = require('../services/authService');

const { AuthError } = require('../errors/AuthError');

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
            user: usuarioCriado
        });

    } catch (error) {

        // Erros de negócio previstos (ex.: 409 por violação de unicidade)
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                error: error.message
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

        // Erros de negócio previstos (ex.: 401 por credenciais inválidas)
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                error: error.message
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