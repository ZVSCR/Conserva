import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadPreferences, savePreferences } from '../../services/userPreferences';
import './PageUserPreferences.css';

const preferences = [
  { id: 'notify_email', label: 'Notificações Email' },
  { id: 'notify_push', label: 'Notificações Push' },
  { id: 'is_dark_theme', label: 'Modo Escuro' },
];

function PageUserPreferences() {
  const [appliedPreferences, setAppliedPreferences] = useState(null);
  const [draftPreferences, setDraftPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;

    loadPreferences()
      .then((loadedPreferences) => {
        if (!active) return;
        setAppliedPreferences(loadedPreferences);
        setDraftPreferences({ ...loadedPreferences });
      })
      .catch((error) => {
        if (active) setNotice({ type: 'error', text: error.message || 'Não foi possível carregar as preferências.' });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const changedPreferences = appliedPreferences && draftPreferences
    ? Object.fromEntries(
      preferences
        .filter(({ id }) => draftPreferences[id] !== appliedPreferences[id])
        .map(({ id }) => [id, draftPreferences[id]]),
    )
    : {};
  const hasChanges = Object.keys(changedPreferences).length > 0;

  const handleToggle = (id, checked) => {
    setDraftPreferences((current) => ({ ...current, [id]: checked }));
    setNotice(null);
  };

  const handleCancel = () => {
    setDraftPreferences({ ...appliedPreferences });
    setNotice({ type: 'info', text: 'Alterações pendentes descartadas.' });
  };

  const handleApply = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    setNotice(null);

    try {
      const savedPreferences = await savePreferences(changedPreferences);
      setAppliedPreferences(savedPreferences);
      setDraftPreferences({ ...savedPreferences });
      setNotice({
        type: 'info',
        text: 'Preferências atualizadas no servidor.',
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Não foi possível aplicar as preferências.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="preferences-page">
      <header className="preferences-page__header">
        <Link className="preferences-page__back" to="/Estoque" aria-label="Voltar para o estoque">
          <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
            <path d="M16 5 3 18l13 13M4 18h29" />
          </svg>
        </Link>
        <span className="preferences-page__brand">Conserva</span>
      </header>

      <h1 className="preferences-page__heading">Altere suas preferências</h1>

      <div className="preferences-page__options" aria-busy={isLoading || isSaving}>
        {draftPreferences ? preferences.map(({ id, label }) => (
          <label className="preferences-page__option" htmlFor={id} key={id}>
            <span>{label}</span>
            <input
              className="preferences-page__toggle"
              id={id}
              name={id}
              type="checkbox"
              role="switch"
              checked={draftPreferences[id]}
              onChange={(event) => handleToggle(id, event.target.checked)}
              disabled={isSaving}
            />
          </label>
        )) : <p className="preferences-page__loading" role="status">
          {isLoading ? 'Carregando preferências...' : 'Preferências indisponíveis.'}
        </p>}
      </div>

      {notice && (
        <p
          className={`preferences-page__feedback${notice.type === 'error' ? ' preferences-page__feedback--error' : ''}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </p>
      )}

      <div className="preferences-page__actions">
        <button type="button" onClick={handleCancel} disabled={!hasChanges || isSaving}>Cancelar</button>
        <button type="button" onClick={handleApply} disabled={!hasChanges || isSaving}>
          {isSaving ? 'Aplicando...' : 'Aplicar'}
        </button>
      </div>
    </main>
  );
}

export default PageUserPreferences;
