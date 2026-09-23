import { useState, useEffect } from "react";
import "./PanelUserData.css";

function PanelUserData() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    tipo: "domestico",
  });

  // Estado para guardar os dados originais vindos do servidor
  const [initialData, setInitialData] = useState({
    username: "",
    email: "",
    tipo: "domestico",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/users/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        const userData = {
          username: data.data.username || "",
          email: data.data.email || "",
          tipo: data.data.tipo || "domestico",
        };

        // Salva nos dois estados: o que preenche o form e o "gabarito" original
        setInitialData(userData);
        setFormData({
          ...userData,
          password: "",
          password2: "",
        });
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setErrorMsg("Não foi possível conectar ao servidor para carregar os dados.");
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para resetar o formulário para os dados originais
  const handleCancel = () => {
    setFormData({
      ...initialData,
      password: "",
      password2: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (formData.password || formData.password2) {
      if (formData.password !== formData.password2) {
        setErrorMsg("As senhas não coincidem. Nenhuma alteração foi salva.");
        setLoading(false);
        return;
      }
    }

    const payload = {};
    if (formData.username) payload.username = formData.username;
    if (formData.email) payload.email = formData.email;
    if (formData.password) payload.password = formData.password;
    if (formData.tipo) payload.tipo = formData.tipo;

    try {
      const response = await fetch("http://localhost:3000/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Erro ao atualizar dados.");
        return;
      }

      console.log("Dados atualizados com sucesso:", data.data);
      setSuccessMsg("Dados atualizados com sucesso!");

      // Atualiza também os dados originais com o que acabou de ser salvo com sucesso
      const updatedOriginals = {
        username: formData.username,
        email: formData.email,
        tipo: formData.tipo,
      };
      setInitialData(updatedOriginals);

      // Limpa os campos de senha
      setFormData((prev) => ({
        ...prev,
        password: "",
        password2: "",
      }));
    } catch (err) {
      console.error("Erro na requisição:", err);
      setErrorMsg("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-data">
      <h2> Altere seus dados </h2>
      
      {errorMsg && <p className="error-message" style={{ color: "red" }}>{errorMsg}</p>}
      {successMsg && <p className="success-message" style={{ color: "green" }}>{successMsg}</p>}

      <form className="data-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleChange}
        />

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
        />

        <label htmlFor="senha">Nova senha (opcional): </label>
        <input
          type="password"
          name="password"
          id="senha"
          value={formData.password}
          onChange={handleChange}
          placeholder="Digite caso queira mudar sua senha"
        />

        <label htmlFor="senha2">Confirme sua nova senha: </label>
        <input
          type="password"
          name="password2"
          id="senha2"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Repita a nova senha, elas devem coincidir"
        />

        <label htmlFor="TipoConta">Tipo de conta:</label>
        <div>
          <input
            type="radio"
            name="tipo"
            id="TipoDomestico"
            value="domestico"
            checked={formData.tipo === "domestico"}
            onChange={handleChange}
          />
          <label htmlFor="TipoDomestico">Doméstico</label>

          <input
            type="radio"
            name="tipo"
            id="TipoComercial"
            value="comercial"
            checked={formData.tipo === "comercial"}
            onChange={handleChange}
          />
          <label htmlFor="TipoComercial">Comercial</label>
        </div>

        <div className="data-confirm">
          <button type="button" onClick={handleCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary-register" disabled={loading}>
            {loading ? "Salvando..." : "Aplicar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PanelUserData;