import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import { registerUser } from "../../../services/auth";

function PanelRegister() {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    tipo: "domestico",
  });

  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const busy = loading || status === 'checking';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg("");

    if (formData.password !== passwordConfirmation) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(formData);
      setFormData((current) => ({ ...current, password: "" }));
      setPasswordConfirmation("");
      navigate('/login', { replace: true, state: { registered: true, identifier: formData.email } });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && status === 'authenticated') return <Navigate to="/home" replace />;

  return (
    <>
      {status === 'checking' && <p role="status">Verificando sessão...</p>}
      {errorMsg && (
        <p className="account-page__notice account-page__notice--error" role="alert">{errorMsg}</p>
      )}

      <form className="account-page__form" method="post" onSubmit={handleSubmit}>
        <label className="account-page__field" htmlFor="username">
          Nome de usuário
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            maxLength={50}
            pattern="[^@]+"
            title="O nome de usuário não pode conter @."
            autoComplete="username"
            disabled={busy}
            required
          />
        </label>

        <label className="account-page__field" htmlFor="email">
          E-mail
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            maxLength={100}
            autoComplete="email"
            disabled={busy}
            required
          />
        </label>

        <label className="account-page__field" htmlFor="password">
          Senha
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={busy}
            required
          />
        </label>

        <label className="account-page__field" htmlFor="password-confirmation">
          Confirmar senha
          <input
            type="password"
            id="password-confirmation"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            disabled={busy}
            required
          />
        </label>

        <label className="account-page__field" htmlFor="tipo">
          Tipo de conta
          <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} disabled={busy}>
            <option value="domestico">Doméstico</option>
            <option value="comercial">Comercial</option>
          </select>
        </label>

        <button type="submit" className="account-page__button account-page__auth-action account-page__button--outline" disabled={busy}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
      <div className="account-page__auth-navigation">
        <p>Já possui uma conta?</p>
        <Link to="/login" className="account-page__button account-page__button--primary account-page__auth-action">
          Login
        </Link>
      </div>
    </>
  );
}

export default PanelRegister;
