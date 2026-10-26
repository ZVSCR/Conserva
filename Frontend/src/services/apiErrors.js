export function getApiErrorMessage(body, fallback = 'Não foi possível concluir a operação.') {
  const errors = body?.errors ?? body?.error;
  if (Array.isArray(errors)) {
    const messages = errors.map((error) => typeof error === 'string' ? error : error?.message)
      .filter((message) => typeof message === 'string' && message.trim());
    if (messages.length > 0) return messages.join(' ');
  }

  if (typeof errors === 'string' && errors.trim()) return errors;
  return typeof body?.message === 'string' && body.message.trim() ? body.message : fallback;
}
