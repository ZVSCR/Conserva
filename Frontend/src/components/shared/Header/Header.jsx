
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import './Header.css';

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState('');

    async function handleLogout() {
        setErrorMsg('');

        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
            setErrorMsg('Não foi possível encerrar a sessão. Tente novamente.');
        }
    }

    return (
        <header className="Header">
            <div>
                <a href="/">HOME</a>
                <h1>ConservAI</h1>
                <div className="Header__account">
                    {user ? (
                        <>
                            <span>Olá, {user.username}</span>
                            <button type="button" onClick={handleLogout}>Sair</button>
                        </>
                    ) : (
                        <a href="/login">Entrar</a>
                    )}
                </div>
                {errorMsg && <p className="Header__error" role="alert">{errorMsg}</p>}
            </div>
        </header>
    );
}

export default Header;