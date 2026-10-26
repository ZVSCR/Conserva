import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import './PanelLogin.css'
function PanelLogin() {
    const { login, user, status, sessionError } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const busy = loading || status === 'checking';

    async function handleSubmit(event) {
        event.preventDefault();
        if (busy) return;
        setLoading(true);
        setErrorMsg('');
        try {
            await login({ identifier: identifier.trim(), password });
            setPassword('');
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="panel-login">
            <h2>Login</h2>
            {status === 'checking' && <p role="status">Verificando sessão...</p>}
            {user && <p role="status">Sessão iniciada como {user.username}.</p>}
            {(errorMsg || sessionError) && <p role="alert">{errorMsg || sessionError}</p>}
            <form className="login-form" method="post" onSubmit={handleSubmit}>
                <label htmlFor="identifier">Usuário/email:</label>
                <input type="text" id="identifier" name="identifier" placeholder="Usuário/email"
                    value={identifier} onChange={(event) => setIdentifier(event.target.value)}
                    maxLength={100} autoComplete="username" required disabled={busy} />
                <label htmlFor="password">Senha:</label>
                <input type="password" id="password" name="password" placeholder="Senha"
                    value={password} onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password" required disabled={busy} />
                <button type="submit" className="btn btn-primary-login" disabled={busy}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <Link to="/registrar">Registrar</Link>
            </form>
        </div>
    );
}

export default PanelLogin;
