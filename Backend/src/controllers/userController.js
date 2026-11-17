const userRepository = require('../repositories/userRepository');
const { validateUsername, validateEmail, validateTipo } = require('../middleware/authValidator');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

const validatePreferencesPayload = (body) => {
  const allowedFields = ['notify_push', 'notify_email', 'is_dark_theme'];

  const hasAtLeastOneField = Object.keys(body).some((key) =>
    allowedFields.includes(key) && body[key] !== undefined
  );

  if (!hasAtLeastOneField) {
    return {
      isValid: false,
      message: 'Forneça ao menos um campo válido para atualização.'
    };
  }

  return { isValid: true };
};

// Registrar novo usuário
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }

    const newUser = await userRepository.createUser({
      username,
      email,
      password_hash: password,
      tipo: 'user'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Usuário cadastrado com sucesso!',
      data: newUser
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return res.status(500).json({ message: 'Erro interno ao salvar usuário.' });
  }
};

// Buscar preferências
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await userRepository.findPreferencesByUserId(userId);

    if (!preferences) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json({
      status: 'success',
      data: preferences
    });
  } catch (error) {
    console.error('Erro em getUserPreferences:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Atualizar preferências
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const validation = validatePreferencesPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const { notify_push, notify_email, is_dark_theme } = req.body;

    const updatedPreferences = await userRepository.updatePreferences(userId, {
      notify_push,
      notify_email,
      is_dark_theme
    });

    if (!updatedPreferences) {
      return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Preferências atualizadas com sucesso.',
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Erro em updateUserPreferences:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const listarGastosUsuarios = async (req, res, next) => {
  try {
    const gastos = await userRepository.buscarGastosTotaisPorUsuario();
    
    return res.status(200).json({
      status: 'success',
      data: gastos
    });
  } catch (error) {
    console.error('Erro em listarGastosUsuarios:', error);
    return res.status(500).json({ message: 'Erro ao buscar o total de gastos dos usuários.' });
  }
}

const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const usuario = await userRepository.findUserDataById(userId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json({
      status: 'success',
      data: usuario
    });
  } catch (error) {
    console.error('Erro em getUserData:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const updateUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, tipo, password } = req.body;

    const errors = [];
    if (username !== undefined) errors.push(...validateUsername(username));
    if (email !== undefined) errors.push(...validateEmail(email));
    if (tipo !== undefined) errors.push(...validateTipo(tipo));
    if (errors.length > 0) return res.status(400).json({ errors });

    if (!username && !email && !tipo && !password) {
      return res.status(400).json({ message: 'Forneça ao menos um campo para atualização.' });
    }

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const usuarioAtualizado = await userRepository.updateUserData(userId, {
      username: username?.trim().toLowerCase(),
      email: email?.trim().toLowerCase(),
      tipo: tipo?.trim().toLowerCase(), passwordHash
    });

    if (!usuarioAtualizado) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ status: 'success', data: usuarioAtualizado });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Username ou email já cadastrado.' });
    }
    console.error('Erro em updateUserData:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = {
  registerUser,
  getUserPreferences,
  updateUserPreferences,
  listarGastosUsuarios,
  updateUserData,
  getUserData
};
