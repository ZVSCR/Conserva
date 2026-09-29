import { Link } from 'react-router-dom';
import styles from './Estoque.module.css';

import IconReceitas from '../../assets/IconsEstoque/livro-de-receitas.png';
import IconCompras from '../../assets/IconsEstoque/carrinho.png';
import IconAdicionar from '../../assets/IconsEstoque/adicionar.png';
import IconEstoque from '../../assets/IconsEstoque/estoque.png';
import IconConfiguracao from '../../assets/IconsEstoque/configuracao.png';

function NavBar({ onAdicionar }) {
    return (
        <nav className={styles.navBar}>
            <Link to="/Estoque" className={styles.navItem}>
                <img src={IconReceitas} alt="Receitas" />
            </Link>

            <Link to="/nova-compra" className={styles.navItem}>
                <img src={IconCompras} alt="Compras" />
            </Link>
            
            <button
                className={`${styles.navItem} ${styles.navItemAdicionar}`}
                disabled    
            > {/*onClick={onAdicionar}*/}

                <img src={IconAdicionar} alt="Adicionar produto" />
            </button>
            

            <Link to="/extrato-compras" className={styles.navItem}>
                <img src={IconEstoque} alt="Estoque" />
            </Link>

            <Link to="/configuracoes" className={styles.navItem}>
                <img src={IconConfiguracao} alt="Configurações" />
            </Link>
        </nav>
    );
}

export default NavBar;
