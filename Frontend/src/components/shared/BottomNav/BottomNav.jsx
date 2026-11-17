import { useState } from 'react';
import { NavLink, useMatch, useNavigate } from 'react-router-dom';
import IconReceitas from '../../../assets/IconsEstoque/livro-de-receitas.png';
import IconCompras from '../../../assets/IconsEstoque/carrinho.png';
import IconAdicionar from '../../../assets/IconsEstoque/adicionar.png';
import IconEstoque from '../../../assets/IconsEstoque/estoque.png';
import IconIngredientes from '../../../assets/IconsEstoque/ingredientes.png';
import IconReceitasPadronizado from '../../../assets/NavegacaoEstoque/receitas.svg';
import IconComprasPadronizado from '../../../assets/NavegacaoEstoque/compras.svg';
import IconAdicionarPadronizado from '../../../assets/NavegacaoEstoque/nova-compra.svg';
import IconIngredientesPadronizado from '../../../assets/NavegacaoEstoque/ingredientes.svg';
import styles from './BottomNav.module.css';

function BottomNav({ padronizada = true }) {
    const [animating, setAnimating] = useState(false);
    const navigate = useNavigate();
    const estaNaNovaCompra = useMatch('/nova-compra');

    function abrirNovaCompra() {
        setAnimating(false);
        navigate('/nova-compra');
    }

    return (
        <>
            <div className={padronizada ? `${styles.spacer} ${styles.spacerPadronizada}` : styles.spacer} aria-hidden="true" />
            <nav className={padronizada ? `${styles.nav} ${styles.padronizada}` : styles.nav} aria-label="Navegação principal">
                <NavLink to="/receitas" end className={styles.item} aria-label="Receitas">
                    <img src={padronizada ? IconReceitasPadronizado : IconReceitas} alt="" />
                </NavLink>
                <NavLink to="/extrato-compras" end className={styles.item} aria-label="Extrato de compras">
                    <img src={padronizada ? IconComprasPadronizado : IconCompras} alt="" />
                </NavLink>
                <button
                    type="button"
                    className={`${styles.item} ${styles.add} ${animating ? styles.addAnimating : ''}`}
                    onClick={() => setAnimating(true)}
                    onAnimationEnd={abrirNovaCompra}
                    aria-label="Nova compra"
                    aria-current={estaNaNovaCompra ? 'page' : undefined}
                >
                    <img src={padronizada ? IconAdicionarPadronizado : IconAdicionar} alt="" />
                </button>
                <NavLink to="/estoque" end className={styles.item} aria-label="Estoque">
                    <img className={styles.iconeEstoque} src={IconEstoque} alt="" />
                </NavLink>
                <NavLink to="/ingredientes" end className={styles.item} aria-label="Ingredientes">
                    <img src={padronizada ? IconIngredientesPadronizado : IconIngredientes} alt="" />
                </NavLink>
            </nav>
        </>
    );
}

export default BottomNav;
