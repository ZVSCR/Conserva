const allowedFields = new Set(['notify_email', 'notify_push', 'is_dark_theme']);

// Dados de demonstração: permanecem apenas enquanto a aplicação está aberta.
let demoPreferences = {
  notify_email: true,
  notify_push: true,
  is_dark_theme: false,
};

export async function loadPreferences() {
  return { ...demoPreferences };
}

export async function savePreferences(changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new TypeError('As alterações devem ser um objeto de preferências.');
  }

  for (const [field, value] of Object.entries(changes)) {
    if (!allowedFields.has(field) || typeof value !== 'boolean') {
      throw new TypeError(`Preferência inválida: ${field}.`);
    }
  }

  demoPreferences = { ...demoPreferences, ...changes };
  return { ...demoPreferences };
}
