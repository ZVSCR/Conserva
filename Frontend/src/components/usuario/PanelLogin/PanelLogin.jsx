
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import './PanelLogin.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

function PanelLogin() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (error) {
                console.error('Resposta inválida ao efetuar login:', error);
                setErrorMsg(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`);
                return;
            }

            if (!response.ok) {
                const validationErrors = Array.isArray(data.errors)
                    ? data.errors.map(({ message }) => message).join(' ')
                    : '';
                setErrorMsg(data.error || validationErrors || `Erro ao efetuar login (HTTP ${response.status}).`);
                return;
            }

            setUser(data.user);
            navigate('/home', { replace: true });
        } catch (error) {
            console.error('Erro ao efetuar login:', error);
            setErrorMsg('Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="panel-login">
            <h2>Login</h2>
            {errorMsg && <p className="error-message" role="alert" style={{ color: 'red' }}>{errorMsg}</p>}
            <form className="login-form" onSubmit={handleSubmit}>
                <label htmlFor="username">Usuário/email:</label>
                <input
                    type="text"
                    id="username"
                    name="identifier"
                    placeholder="Usuário/email"
                    autoComplete="username"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                />
                <label htmlFor="password">Senha:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Senha"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className="btn btn-primary-login" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <a href="/registrar">Registrar</a>
            </form>
        </div>
    );
}

export default PanelLogin;