import { useState } from "react";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    tipo: "user", // Defina o tipo padrão exigido pelo backend
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
        body: JSON.stringify(formData), // Envia todos os 4 campos esperados no auth.test.js
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "Erro no registro.");
        return;
      }

      console.log("Usuário registrado com sucesso:", data.user);
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      setErrorMsg("Falha na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      {errorMsg && <p className="error-message" style={{ color: "red" }}>{errorMsg}</p>}

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
        {loading ? "Cadastrando..." : "Register"}
      </button>
      <a href="/login">Already have an account? Login</a>
    </form>
  );
}