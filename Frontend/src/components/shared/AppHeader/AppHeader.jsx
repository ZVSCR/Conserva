import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import perfil from '../../../assets/IconsEstoque/perfil.png';
import marca from '../../../assets/NavegacaoEstoque/marca.svg';
import perfilEstoque from '../../../assets/NavegacaoEstoque/perfil.svg';
import styles from './AppHeader.module.css';

function AppHeader({ variante, voltarPara, rotuloVoltar } = {}) {
    const estoque = variante === 'estoque';
    const classesHeader = [styles.header, estoque && styles.estoque, voltarPara && styles.comVoltar]
        .filter(Boolean)
        .join(' ');
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [menuAberto, setMenuAberto] = useState(false);
    const accountRef = useRef(null);
    const botaoRef = useRef(null);

    // Enquanto o menu está aberto: fecha ao clicar fora e ao apertar Esc
    useEffect(() => {
        if (!menuAberto) return;

        function aoClicarFora(event) {
            if (accountRef.current && !accountRef.current.contains(event.target)) {
                setMenuAberto(false);
            }
        }

        function aoPressionarTecla(event) {
            if (event.key === 'Escape') {
                setMenuAberto(false);
                botaoRef.current?.focus();
            }
        }

        document.addEventListener('pointerdown', aoClicarFora);
        document.addEventListener('keydown', aoPressionarTecla);

        return () => {
            document.removeEventListener('pointerdown', aoClicarFora);
            document.removeEventListener('keydown', aoPressionarTecla);
        };
    }, [menuAberto]);

    function alternarMenu() {
        setMenuAberto((aberto) => !aberto);
        setError('');
    }

    async function handleLogout() {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch {
            // O menu continua aberto para a mensagem de erro aparecer
            setError('Não foi possível encerrar a sessão.');
        }
    }

    return (
        <header className={classesHeader}>
            {voltarPara && (
                <Link className={styles.voltar} to={voltarPara} aria-label={rotuloVoltar}>
                    <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
                        <path d="M16 5 3 18l13 13M4 18h29" />
                    </svg>
                </Link>
            )}
            <Link to="/estoque" className={styles.logo}>
                {(voltarPara || estoque) && (
                    <img className={voltarPara ? styles.simboloCompra : styles.marcaEstoque} src={marca} alt="" width="67" height="70" />
                )}
                Conserva
            </Link>

            <div className={styles.account} ref={accountRef}>
                <button
                    type="button"
                    ref={botaoRef}
                    className={styles.avatarButton}
                    onClick={alternarMenu}
                    aria-expanded={menuAberto}
                    aria-controls="menu-usuario"
                    aria-label="Menu do usuário"
                >
                    <img src={estoque ? perfilEstoque : perfil} alt="" />
                </button>

                {menuAberto && (
                    <div id="menu-usuario" className={styles.menu}>
                        <p className={styles.menuUsuario}>{user?.username}</p>
                        <Link
                            to="/alterar-dados"
                            className={styles.menuItem}
                            onClick={() => setMenuAberto(false)}
                        >
                            Editar dados
                        </Link>
                        <Link
                            to="/configuracoes"
                            className={styles.menuItem}
                            onClick={() => setMenuAberto(false)}
                        >
                            Configurações
                        </Link>
                        <button type="button" className={styles.menuItem} onClick={handleLogout}>
                            Sair
                        </button>
                        {error && <p className={styles.menuErro} role="alert">{error}</p>}
                    </div>
                )}
            </div>
        </header>
    );
}

export default AppHeader;
