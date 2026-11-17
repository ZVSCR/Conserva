import { apiFetch } from '../../../services/api.js';
import { useState, useEffect } from "react";
import { getApiErrorMessage } from "../../../services/apiErrors";
import { useAuth } from "../../../contexts/useAuth";
import fotoUsuario from "../../../assets/Account/foto-usuario.svg";
import iconeSenha from "../../../assets/Account/ocultar-senha.svg";
import "./PanelUserData.css";
import {useNavigate} from 'react-router-dom';

function CampoSenha({ id, name, label, descricao, value, onChange, placeholder, visivel, onToggle }) {

  return (
    <div className="account-page__field">
      <label htmlFor={id}>{label}</label>
      <div className="user-data__password">
        <input
          type={visivel ? "text" : "password"}
          name={name}
          id={id}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="user-data__password-toggle"
          aria-label={descricao}
          aria-pressed={visivel}
          aria-controls={id}
          onClick={() => onToggle(name)}
        >
          <img src={iconeSenha} alt="" width="40" height="40" />
        </button>
      </div>
    </div>
  );
}

function PanelUserData() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

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
  const [senhasVisiveis, setSenhasVisiveis] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiFetch(`/api/users/me`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(getApiErrorMessage(data, 'Erro ao buscar dados.'));

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

  const alternarSenha = (name) => {
    setSenhasVisiveis((atuais) => ({ ...atuais, [name]: !atuais[name] }));
  };

  // Função para resetar o formulário para os dados originais
  const handleCancel = () => {
    setSenhasVisiveis({});
    setFormData({
      ...initialData,
      password: "",
      password2: "",
    });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

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
      const response = await apiFetch(`/api/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(getApiErrorMessage(data, "Erro ao atualizar dados."));
        return;
      }

      await refreshSession({ silent: true });
      navigate('/estoque');

    } catch (err) {
      console.error("Erro na requisição:", err);
      setErrorMsg("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p role="status">Carregando dados do perfil...</p>;

  return (
    <>
      <button className="user-data__avatar" type="button" disabled>
        <img src={fotoUsuario} alt="" width="75" height="75" />
        Alterar foto
      </button>

      {errorMsg && <p className="account-page__notice account-page__notice--error" role="alert">{errorMsg}</p>}

      <form className="account-page__form user-data__form" onSubmit={handleSubmit} aria-busy={loading}>
        <label className="account-page__field" htmlFor="username">
          Nome de usuário
          <input
            type="text"
            name="username"
            id="username"
            maxLength={50}
            pattern="[^@]+"
            title="O nome de usuário não pode conter @."
            autoComplete="username"
            placeholder="Digite seu nome de usuário"
            value={formData.username}
            onChange={handleChange}
          />
        </label>

        <label className="account-page__field" htmlFor="email">
          E-mail
          <input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        <CampoSenha
          id="senha"
          name="password"
          visivel={senhasVisiveis.password ?? false}
          onToggle={alternarSenha}
          label="Nova senha (opcional)"
          descricao="Mostrar nova senha"
          value={formData.password}
          onChange={handleChange}
          placeholder="Digite a nova senha"
        />

        <CampoSenha
          id="senha2"
          name="password2"
          visivel={senhasVisiveis.password2 ?? false}
          onToggle={alternarSenha}
          label="Confirme sua nova senha"
          descricao="Mostrar confirmação da nova senha"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Repita a nova senha"
        />

        <label className="account-page__field" htmlFor="TipoConta">
          Tipo de conta
          <select id="TipoConta" name="tipo" value={formData.tipo} onChange={handleChange}>
            <option value="domestico">Doméstico</option>
            <option value="comercial">Comercial</option>
          </select>
        </label>

        <div className="account-page__actions user-data__actions">
          <button className="account-page__button" type="button" onClick={handleCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="account-page__button account-page__button--primary" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Aplicar"}
          </button>
        </div>
      </form>
    </>
  );
}

export default PanelUserData;
