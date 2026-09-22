import { useState } from "react";
import "./PanelRegister.css";

function PanelRegister() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    tipo: "adm", // Defina o valor padrão de acordo com o papel no painel
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Erro ao efetuar registro.");
        return;
      }

      console.log("Painel: Usuário criado com sucesso:", data.user);
      // Aqui você pode redirecionar ou limpar o formulário
    } catch (err) {
      console.error("Erro na requisição:", err);
      setErrorMsg("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-register">
      <h2>Register</h2>
      {errorMsg && <p className="error-message" style={{ color: "red" }}>{errorMsg}</p>}
      
      <form className="register-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
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
          required
        />

        <button type="submit" className="btn btn-primary-register" disabled={loading}>
          {loading ? "Registrando..." : "Register"}
        </button>
        <a href="/login">Already have an account? Login</a>
      </form>
    </div>
  );
}

export default PanelRegister;