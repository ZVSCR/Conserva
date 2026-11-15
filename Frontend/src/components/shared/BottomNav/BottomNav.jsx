import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconReceitas from '../../../assets/IconsEstoque/livro-de-receitas.png';
import IconCompras from '../../../assets/IconsEstoque/carrinho.png';
import IconAdicionar from '../../../assets/IconsEstoque/adicionar.png';
import IconEstoque from '../../../assets/IconsEstoque/estoque.png';
import IconIngredientes from '../../../assets/IconsEstoque/ingredientes.png';
import EstoqueReceitas from '../../../assets/NavegacaoEstoque/receitas.svg';
import EstoqueCompras from '../../../assets/NavegacaoEstoque/compras.svg';
import EstoqueNovaCompra from '../../../assets/NavegacaoEstoque/nova-compra.svg';
import EstoqueIngredientes from '../../../assets/NavegacaoEstoque/ingredientes.svg';
import EstoqueConfiguracoes from '../../../assets/NavegacaoEstoque/configuracoes.svg';
import styles from './BottomNav.module.css';

function BottomNav({ variante } = {}) {
    const estoque = variante === 'estoque';
    const [animating, setAnimating] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <div className={styles.spacer} aria-hidden="true" />
            <nav className={estoque ? `${styles.nav} ${styles.estoque}` : styles.nav} aria-label="Navegação principal">
                <Link to="/receitas" className={styles.item} aria-label="Receitas">
                    <img src={estoque ? EstoqueReceitas : IconReceitas} alt="" />
                </Link>
                <Link to="/extrato-compras" className={styles.item} aria-label="Extrato de compras">
                    <img src={estoque ? EstoqueCompras : IconCompras} alt="" />
                </Link>
                <button
                    type="button"
                    className={`${styles.item} ${styles.add} ${animating ? styles.addAnimating : ''}`}
                    onClick={() => setAnimating(true)}
                    onAnimationEnd={() => navigate('/nova-compra')}
                    aria-label="Nova compra"
                >
                    <img src={estoque ? EstoqueNovaCompra : IconAdicionar} alt="" />
                </button>
                {!estoque && (
                    <Link to="/estoque" className={styles.item} aria-label="Estoque">
                        <img src={IconEstoque} alt="" />
                    </Link>
                )}
                <Link to="/ingredientes" className={styles.item} aria-label="Ingredientes">
                    <img src={estoque ? EstoqueIngredientes : IconIngredientes} alt="" />
                </Link>
                {estoque && (
                    <Link to="/configuracoes" className={styles.item} aria-label="Configurações">
                        <img src={EstoqueConfiguracoes} alt="" />
                    </Link>
                )}
            </nav>
        </>
    );
}

export default BottomNav;
