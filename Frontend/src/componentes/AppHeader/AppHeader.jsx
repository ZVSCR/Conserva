import { Link } from 'react-router-dom';
import perfil from '../../assets/IconsEstoque/perfil.png';
import styles from './AppHeader.module.css';

function AppHeader() {
    return (
        <header className={styles.header}>
            <Link to="/home" className={styles.logo}>Conserva</Link>
            <Link to="/alterar-dados" className={styles.profile} aria-label="Dados do perfil">
                <img src={perfil} alt="" />
            </Link>
        </header>
    );
}

export default AppHeader;
