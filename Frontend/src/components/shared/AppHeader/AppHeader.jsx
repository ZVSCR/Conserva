import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import perfil from '../../../assets/IconsEstoque/perfil.png';
import styles from './AppHeader.module.css';

function AppHeader({ accountTitle }) {
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
        <header className={accountTitle ? styles.profileHeader : styles.header}>
            <Link to="/home" className={accountTitle ? 'account-page__brand' : styles.logo}>
                Conserva
            </Link>
            {accountTitle && <h1 className="account-page__title">{accountTitle}</h1>}

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
                    <img src={perfil} alt="" />
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
