import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import { registerUser } from "../../../services/auth";
import "./PanelRegister.css";

function PanelRegister() {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    tipo: "domestico",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || status === 'checking') return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await registerUser(formData);
      setFormData((current) => ({ ...current, password: "" }));
      setSuccessMsg("Conta criada com sucesso. Você já pode fazer login.");
      navigate('/login', { replace: true, state: { registered: true, identifier: formData.email } });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && status === 'authenticated') return <Navigate to="/estoque" replace />;

  return (
    <div className="panel-register">
      <h2>Register</h2>
      {errorMsg && <p className="error-message" role="alert" style={{ color: "red" }}>{errorMsg}</p>}
      {successMsg && <p role="status">{successMsg}</p>}

      <form className="register-form" method="post" onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          maxLength={50}
          pattern="[^@]+"
          title="O nome de usuário não pode conter @."
          autoComplete="username"
          disabled={loading}
          required
        />

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          maxLength={100}
          autoComplete="email"
          disabled={loading}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          disabled={loading}
          required
        />

        <label htmlFor="tipo">Tipo de conta:</label>
        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} disabled={loading}>
          <option value="domestico">Doméstico</option>
          <option value="comercial">Comercial</option>
        </select>

        <button type="submit" className="btn btn-primary-register" disabled={loading}>
          {loading ? "Registrando..." : "Register"}
        </button>
        <Link to="/login">Já tem uma conta? Entrar</Link>
      </form>
    </div>
  );
}

export default PanelRegister;
