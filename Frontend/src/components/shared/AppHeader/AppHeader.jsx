import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import perfil from '../../../assets/IconsEstoque/perfil.png';
import styles from './AppHeader.module.css';

function AppHeader() {
    const { user, logout } = useAuth();
    const [leaving, setLeaving] = useState(false);
    const [error, setError] = useState('');

    async function handleLogout() {
        if (leaving) return;
        setLeaving(true);
        setError('');
        try {
            await logout();
        } catch (failure) {
            setError(failure.message);
        } finally {
            setLeaving(false);
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
                <button type="button" onClick={handleLogout} disabled={leaving}>{leaving ? 'Saindo...' : 'Sair'}</button>
                {error && <span role="alert">{error}</span>}
            </div>
        </header>
    );
}

export default AppHeader;
