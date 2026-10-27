import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconReceitas from '../../../assets/IconsEstoque/livro-de-receitas.png';
import IconCompras from '../../../assets/IconsEstoque/carrinho.png';
import IconAdicionar from '../../../assets/IconsEstoque/adicionar.png';
import IconEstoque from '../../../assets/IconsEstoque/estoque.png';
import IconConfiguracao from '../../../assets/IconsEstoque/configuracao.png';
import styles from './BottomNav.module.css';

function BottomNav() {
    const [animating, setAnimating] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <div className={styles.spacer} aria-hidden="true" />
            <nav className={styles.nav} aria-label="Navegação principal">
                <Link to="/receitas" className={styles.item} aria-label="Receitas">
                    <img src={IconReceitas} alt="" />
                </Link>
                <Link to="/extrato-compras" className={styles.item} aria-label="Extrato de compras">
                    <img src={IconCompras} alt="" />
                </Link>
                <button
                    type="button"
                    className={`${styles.item} ${styles.add} ${animating ? styles.addAnimating : ''}`}
                    onClick={() => setAnimating(true)}
                    onAnimationEnd={() => navigate('/nova-compra')}
                    aria-label="Nova compra"
                >
                    <img src={IconAdicionar} alt="" />
                </button>
                <Link to="/estoque" className={styles.item} aria-label="Estoque">
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
