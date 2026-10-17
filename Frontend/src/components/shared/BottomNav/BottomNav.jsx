import { Link } from 'react-router-dom';
import IconReceitas from '../../../assets/IconsEstoque/livro-de-receitas.png';
import IconCompras from '../../../assets/IconsEstoque/carrinho.png';
import IconAdicionar from '../../../assets/IconsEstoque/adicionar.png';
import IconEstoque from '../../../assets/IconsEstoque/estoque.png';
import IconConfiguracao from '../../../assets/IconsEstoque/configuracao.png';
import styles from './BottomNav.module.css';

function BottomNav() {
    return (
        <>
            <div className={styles.spacer} aria-hidden="true" />
            <nav className={styles.nav} aria-label="Navegação principal">
                <Link to="/historico-refeicoes" className={styles.item} aria-label="Refeições preparadas">
                    <img src={IconReceitas} alt="" />
                </Link>
                <Link to="/nova-compra" className={styles.item} aria-label="Nova compra">
                    <img src={IconCompras} alt="" />
                </Link>
                <button type="button" className={`${styles.item} ${styles.add}`} disabled aria-label="Adicionar produto (em breve)">
                    <img src={IconAdicionar} alt="" />
                </button>
                <Link to="/extrato-compras" className={styles.item} aria-label="Extrato de compras">
                    <img src={IconEstoque} alt="" />
                </Link>
                <Link to="/configuracoes" className={styles.item} aria-label="Configurações">
                    <img src={IconConfiguracao} alt="" />
                </Link>
            </nav>
        </>
    );
}

export default BottomNav;
