const bcrypt = require('bcrypt');

const {
    registerRepo,
    loginRepo,
    findUserByIdRepo
} = require('../repositories/authRepository');

const {
    AuthError
} = require('../errors/AuthError');
// Configura o custo computacional do bcrypt
const SALT_ROUNDS = 12;

const MSG_INVALID_CREDENTIALS = 'Identificador ou senha inválidos.';

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

    // Aplica hash na senha
    const passwordHash = await bcrypt.hash(
        password,
        SALT_ROUNDS
    );

    // Retorna o resultado da inserção dos dados no repositório
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

    // Busca identificador no repositório
    const userSearch = await loginRepo({ identifier: normalizedIdentifier });

    if (!userSearch) {
        throw new AuthError(MSG_INVALID_CREDENTIALS, 401);
    }

    // Valida senha para o usuário encontrado
    const validPassword = await bcrypt.compare(
        password,
        userSearch.password_hash
    );

    if (!validPassword) {
        throw new AuthError(MSG_INVALID_CREDENTIALS, 401);
    }

    // Retorna apenas dados públicos, sem o hash da senha
    return {
        id: userSearch.id,
        username: userSearch.username,
        email: userSearch.email,
        tipo: userSearch.tipo
    };
}

async function getUserByIdService(id) {
    return findUserByIdRepo(id);
}

module.exports = {
    registerService,
    loginService,
    getUserByIdService
};