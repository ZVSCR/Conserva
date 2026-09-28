const preferenceFields = ['notify_email', 'notify_push', 'is_dark_theme'];
const allowedFields = new Set(preferenceFields);
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const preferencesUrl = `${apiBaseUrl}/api/users/me/preferences`;

async function requestPreferences(options) {
  let response;

  try {
    response = await fetch(preferencesUrl, options);
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || body?.error || `Erro ao acessar as preferências (HTTP ${response.status}).`);
  }

  if (!body?.data || !preferenceFields.every((field) => typeof body.data[field] === 'boolean')) {
    throw new Error('O servidor retornou preferências em formato inválido.');
  }

  return Object.fromEntries(preferenceFields.map((field) => [field, body.data[field]]));
}

export async function loadPreferences() {
  return requestPreferences({ method: 'GET' });
}

export async function savePreferences(changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new TypeError('As alterações devem ser um objeto de preferências.');
  }

  const entries = Object.entries(changes);

  if (entries.length === 0) {
    throw new TypeError('Informe ao menos uma preferência para atualizar.');
  }

  for (const [field, value] of entries) {
    if (!allowedFields.has(field) || typeof value !== 'boolean') {
      throw new TypeError(`Preferência inválida: ${field}.`);
    }
  }

  return requestPreferences({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}
