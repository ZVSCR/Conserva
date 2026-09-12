const userRepository = require('../repositories/userRepository');

const validatePreferencesPayload = (body) => {
  const allowedFields = ['push_notifications', 'email_notifications', 'dark_theme'];

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

    const { push_notifications, email_notifications, dark_theme } = req.body;

    const updatedPreferences = await userRepository.updatePreferences(userId, {
      push_notifications,
      email_notifications,
      dark_theme
    });

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

module.exports = {
  getUserPreferences,
  updateUserPreferences
};