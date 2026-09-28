import { useState } from 'react';
import { Link } from 'react-router-dom';
import './PageUserPreferences.css';

const defaultPreferences = {
  notify_email: true,
  notify_push: true,
  is_dark_theme: false,
};

const preferences = [
  { id: 'notify_email', label: 'Notificações Email' },
  { id: 'notify_push', label: 'Notificações Push' },
  { id: 'is_dark_theme', label: 'Modo Escuro' },
];

function PageUserPreferences() {
  const [appliedPreferences, setAppliedPreferences] = useState(defaultPreferences);
  const [draftPreferences, setDraftPreferences] = useState(defaultPreferences);
  const [feedback, setFeedback] = useState('');

  const changedPreferences = Object.fromEntries(
    preferences
      .filter(({ id }) => draftPreferences[id] !== appliedPreferences[id])
      .map(({ id }) => [id, draftPreferences[id]]),
  );
  const hasChanges = Object.keys(changedPreferences).length > 0;

  const handleToggle = (id, checked) => {
    setDraftPreferences((current) => ({ ...current, [id]: checked }));
    setFeedback('');
  };

  const handleCancel = () => {
    setDraftPreferences({ ...appliedPreferences });
    setFeedback('Alterações pendentes descartadas.');
  };

  const handleApply = () => {
    setAppliedPreferences((current) => ({ ...current, ...changedPreferences }));
    setFeedback('Preferências aplicadas apenas nesta página. Nada foi salvo no servidor.');
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

      <div className="preferences-page__options">
        {preferences.map(({ id, label }) => (
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
            />
          </label>
        ))}
      </div>

      {feedback && <p className="preferences-page__feedback" role="status">{feedback}</p>}

      <div className="preferences-page__actions">
        <button type="button" onClick={handleCancel} disabled={!hasChanges}>Cancelar</button>
        <button type="button" onClick={handleApply} disabled={!hasChanges}>Aplicar</button>
      </div>
    </main>
  );
}

export default PageUserPreferences;
