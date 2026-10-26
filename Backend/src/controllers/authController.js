const {
    validateRegister,
    validateLogin
} = require('../middleware/authValidator');

const {
    registerService,
    loginService
} = require('../services/authService');

const { AuthError } = require('../errors/AuthError');
const { clearSessionCookie } = require('../config/session');

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

        // Uma sessão nova evita reutilizar a identificação anterior ao login.
        await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
        try {
            req.session.userId = userFound.id;
            await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
        } catch (error) {
            await new Promise((resolve) => req.session.destroy(() => resolve()));
            clearSessionCookie(res);
            throw error;
        }

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

async function logout(req, res) {
    try {
        await new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
        clearSessionCookie(res);
        return res.sendStatus(204);
    } catch (error) {
        console.error('Erro ao encerrar sessão:', error);
        return res.status(503).json({ error: 'Não foi possível encerrar a sessão.' });
    }
}

module.exports = {
    register,
    login,
    logout
};

// Primeiro controller: ~240 LOC
// Novo controller: 100 LOC
