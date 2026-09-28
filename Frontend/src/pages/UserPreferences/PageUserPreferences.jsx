import { Link } from 'react-router-dom';
import './PageUserPreferences.css';

const preferences = [
  { id: 'notify_email', label: 'Notificações Email', enabledByDefault: true },
  { id: 'notify_push', label: 'Notificações Push', enabledByDefault: true },
  { id: 'is_dark_theme', label: 'Modo Escuro', enabledByDefault: false },
];

function PageUserPreferences() {
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
        {preferences.map(({ id, label, enabledByDefault }) => (
          <label className="preferences-page__option" htmlFor={id} key={id}>
            <span>{label}</span>
            <input
              className="preferences-page__toggle"
              id={id}
              name={id}
              type="checkbox"
              role="switch"
              defaultChecked={enabledByDefault}
            />
          </label>
        ))}
      </div>

      <div className="preferences-page__actions">
        <button type="button" disabled>Cancelar</button>
        <button type="button" disabled>Aplicar</button>
      </div>
    </main>
  );
}

export default PageUserPreferences;
