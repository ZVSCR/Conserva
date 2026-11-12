import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';

function PanelLogin() {
    const { login, user, status, sessionError } = useAuth();
    const location = useLocation();
    const [identifier, setIdentifier] = useState(location.state?.identifier || '');
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

    if (user && status === 'authenticated') return <Navigate to="/home" replace />;

    return (
        <>
            {location.state?.registered && (
                <p className="account-page__notice" role="status">
                    Conta criada com sucesso. Faça login para continuar.
                </p>
            )}
            {status === 'checking' && <p role="status">Verificando sessão...</p>}
            {user && <p role="status">Sessão iniciada como {user.username}.</p>}
            {(errorMsg || sessionError) && (
                <p className="account-page__notice account-page__notice--error" role="alert">
                    {errorMsg || sessionError}
                </p>
            )}
            <form className="account-page__form" method="post" onSubmit={handleSubmit}>
                <label className="account-page__field" htmlFor="identifier">
                    E-mail ou nome de usuário
                    <input type="text" id="identifier" name="identifier"
                        value={identifier} onChange={(event) => setIdentifier(event.target.value)}
                        maxLength={100} autoComplete="username" required disabled={busy} />
                </label>
                <label className="account-page__field" htmlFor="password">
                    Senha
                    <input type="password" id="password" name="password"
                        value={password} onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password" required disabled={busy} />
                </label>
                <button type="submit" className="account-page__button account-page__button--primary" disabled={busy}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
            <p className="account-page__alternate account-page__alternate--bottom">
                Não possui uma conta? <Link to="/registrar">Registre-se</Link>
            </p>
        </>
    );
}

export default PanelLogin;
