const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

const validatePreferencesPayload = (body) => {
  const allowedFields = ['notify_push', 'notify_email', 'is_dark_theme'];

  // Garante que ao menos um campo permitido foi enviado
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

const getUserPreferences = async (req, res, next) => {
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

const updateUserPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Executa a validação do payload
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

const updateUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, tipo, password } = req.body;

    if (!username && !email && !tipo && !password) {
      return res.status(400).json({ message: 'Forneça ao menos um campo para atualização.' });
    }

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const usuarioAtualizado = await userRepository.updateUserData(userId, {
      username, email, tipo, passwordHash
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
  getUserPreferences,
  updateUserPreferences,
  updateUserData
};