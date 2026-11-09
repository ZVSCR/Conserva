import { apiFetch } from '../../../services/api.js';
import { useState, useEffect } from "react";
import { getApiErrorMessage } from "../../../services/apiErrors";
import { useAuth } from "../../../contexts/useAuth";
import { useNavigate } from 'react-router-dom';
import hiddenPasswordIcon from '../../../assets/Account/senha-oculta.png';

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
  const [showPassword, setShowPassword] = useState(false);

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

  // Função para resetar o formulário para os dados originais
  const handleCancel = () => {
    setFormData({
      ...initialData,
      password: "",
      password2: "",
    });
    setErrorMsg("");
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg("");

    if (formData.password || formData.password2) {
      if (formData.password !== formData.password2) {
        setErrorMsg("As senhas não coincidem. Nenhuma alteração foi salva.");
        return;
      }
    }

    const payload = {};
    if (formData.username) payload.username = formData.username;
    if (formData.email) payload.email = formData.email;
    if (formData.password) payload.password = formData.password;
    if (formData.tipo) payload.tipo = formData.tipo;

    setLoading(true);
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

  if (fetching) return <p role="status">Carregando dados do perfil...</p>;

  return (
    <>
      {errorMsg && (
        <p className="account-page__notice account-page__notice--error" role="alert">{errorMsg}</p>
      )}

      <form className="account-page__form" onSubmit={handleSubmit}>
        <fieldset className="account-page__section" disabled={loading}>
          <legend>Dados da conta</legend>
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
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label className="account-page__field" htmlFor="tipo">
            Tipo de conta
            <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange}>
              <option value="domestico">Doméstico</option>
              <option value="comercial">Comercial</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="account-page__section" disabled={loading}>
          <legend>Alterar senha</legend>
          <div className="account-page__field">
            <label htmlFor="senha">Nova senha (opcional)</label>
            <div className="account-page__password">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="senha"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="account-page__visibility"
                aria-label={showPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? "Ocultar" : <img src={hiddenPasswordIcon} alt="" />}
              </button>
            </div>
          </div>

          <label className="account-page__field" htmlFor="senha2">
            Confirme sua nova senha
            <input
              type="password"
              name="password2"
              id="senha2"
              autoComplete="new-password"
              value={formData.password2}
              onChange={handleChange}
            />
          </label>
        </fieldset>

        <div className="account-page__actions">
          <button type="button" className="account-page__button" onClick={handleCancel} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="account-page__button account-page__button--primary" disabled={loading}>
            {loading ? "Salvando..." : "Aplicar"}
          </button>
        </div>
      </form>
    </>
  );
}

export default PanelUserData;
