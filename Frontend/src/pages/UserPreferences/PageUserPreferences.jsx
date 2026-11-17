import { useEffect, useState } from 'react';
import AccountPage from '../../components/usuario/AccountPage/AccountPage';
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
    <AccountPage title="Altere suas preferências" className="preferences-page" voltarAoEstoque>
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
          className={`account-page__notice preferences-page__feedback${notice.type === 'error' ? ' account-page__notice--error' : ''}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </p>
      )}

      <div className="account-page__actions preferences-page__actions">
        <button className="account-page__button" type="button" onClick={handleCancel} disabled={!hasChanges || isSaving}>Cancelar</button>
        <button className="account-page__button account-page__button--primary" type="button" onClick={handleApply} disabled={!hasChanges || isSaving}>
          {isSaving ? 'Aplicando...' : 'Aplicar'}
        </button>
      </div>
    </AccountPage>
  );
}

export default PageUserPreferences;
