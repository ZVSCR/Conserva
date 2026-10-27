import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import perfil from '../../../assets/IconsEstoque/perfil.png';
import styles from './AppHeader.module.css';

function AppHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    async function handleLogout() {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch {
            setError('Não foi possível encerrar a sessão.');
        }
    }

    return (
        <header className={styles.header}>
            <Link to="/home" className={styles.logo}>Conserva</Link>
            <div className={styles.account}>
                <span>{user?.username}</span>
                <Link to="/alterar-dados" className={styles.profile} aria-label="Dados do perfil">
                    <img src={perfil} alt="" />
                </Link>
                <button type="button" onClick={handleLogout}>Sair</button>
                {error && <span role="alert">{error}</span>}
            </div>
        </header>
    );
}

export default AppHeader;
