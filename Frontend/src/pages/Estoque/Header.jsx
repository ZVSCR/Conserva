import { Link } from 'react-router-dom';
import styles from './Estoque.module.css';
import perfil from '../../assets/IconsEstoque/perfil.png';
function Header() {
    return (
        <header className={styles.header}>
            <h1 className={styles.logo}>
                 <Link to="/home">Conserva</Link>
            </h1>

            <nav>
                <ul className={styles.headerNav}>
                    <li>
                        <Link to="/alterar-dados">
                            <img src={perfil} alt="Perfil" className={styles.perfilImg} />
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;
