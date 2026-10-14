const {
    registerRepo,
    loginRepo
} = require('../repositories/authRepository');

const bcrypt = require('bcrypt');

// Configura o custo computacional do bcrypt
const SALT_ROUNDS = 12;

async function registerService(user) {

    const {
        username,
        email,
        password,
        tipo
    } = user;

    // Normaliza campos para salvar no BD
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedTipo = tipo.trim();
    let passwordHash;

    try {

        // Aplica hash na senha
        passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );
    } catch (error) {

        console.error('Erro em authService.registerService:', error);
        throw error;
    }

    return registerRepo({
        username: normalizedUsername,
        email: normalizedEmail,
        password_hash: passwordHash,
        tipo: normalizedTipo
    });
}

async function loginService(user) {

    const {
        identifier,
        password
    } = user;

    const normalizedIdentifier = identifier.trim().toLowerCase();
    let userSearch;
    let validPassword

    try {

        // Busca identificador no repositório
        userSearch = await loginRepo({ identifier: normalizedIdentifier });
        // Valida senha para o usuário encontrado
        validPassword = await bcrypt.compare(
            password,
            userSearch.password_hash
        );

        if (!validPassword) {
            throw new Error('Identificador ou senha inválidos.');
        }

        const userFound = ({
            id: userFound.id,
            username: userFound.username,
            email: userFound.email,
            tipo: userFound.tipo
        });

        return userFound;

    } catch (error) {

        console.error('Erro em authService.loginService:', error);
        throw error;
    }
}

module.exports = {
    registerService,
    loginService
};