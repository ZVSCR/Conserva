import { Link } from 'react-router-dom';
import styles from './Estoque.module.css';

import IconReceitas from '../../assets/IconsEstoque/livro-de-receitas.png';
import IconCompras from '../../assets/IconsEstoque/carrinho.png';
import IconAdicionar from '../../assets/IconsEstoque/adicionar.png';
import IconNotificacoes from '../../assets/IconsEstoque/mensagens.png';
import IconConfiguracao from '../../assets/IconsEstoque/configuracao.png';

function NavBar({ onAdicionar }) {
    return (
        <nav className={styles.navBar}>
            <Link to="/Estoque" className={styles.navItem}>
                <img src={IconReceitas} alt="Receitas" />
            </Link>

            <Link to="/Estoque" className={styles.navItem}>
                <img src={IconCompras} alt="Compras" />
            </Link>

            <button
                className={`${styles.navItem} ${styles.navItemAdicionar}`}
                onClick={onAdicionar}
            >
                <img src={IconAdicionar} alt="Adicionar produto" />
            </button>

            <Link to="/Estoque" className={styles.navItem}>
                <img src={IconNotificacoes} alt="Notificações" />
            </Link>

            <Link to="/Estoque" className={styles.navItem}>
                <img src={IconConfiguracao} alt="Configurações" />
            </Link>
        </nav>
    );
}

export default NavBar;