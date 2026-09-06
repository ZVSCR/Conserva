import styles from './Produtos.module.css';
import sino from '../../assets/IconsProd/sinoLimpo.png';
import perfil from '../../assets/IconsProd/perfil.png';
function Header() {
    return (
        <header className={styles.header}>
            <h1 className={styles.logo}>
                <a href="#">Conserva</a>
            </h1>

            <nav>
                <ul className={styles.headerNav}>
                    <li>
                        <a href="#">
                            <img src={sino} alt="Notificações" />
                        </a>
                    </li>

                    <li>
                        <a href="#">
                            <img src={perfil} alt="Perfil" />
                        </a>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;
