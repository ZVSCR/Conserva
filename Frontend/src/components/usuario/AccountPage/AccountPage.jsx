import { Link } from 'react-router-dom';
import conservaLogo from '../../../assets/Account/conserva-logo.svg';
import conservaSimbolo from '../../../assets/NavegacaoEstoque/marca.svg';
import './AccountPage.css';

function AccountPage({ title, children, voltarAoEstoque = false, className = '' }) {
    const variante = voltarAoEstoque ? 'account-page--interior' : 'account-page--auth';

    return (
        <main className={['account-page', variante, className].filter(Boolean).join(' ')}>
            <header className="account-page__header">
                {voltarAoEstoque ? (
                    <>
                        <Link className="account-page__back" to="/estoque" aria-label="Voltar para o estoque">
                            <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
                                <path d="M16 5 3 18l13 13M4 18h29" />
                            </svg>
                        </Link>
                        <span className="account-page__brand">
                            <img src={conservaSimbolo} alt="" width="67" height="70" />
                            Conserva
                        </span>
                    </>
                ) : (
                    <img src={conservaLogo} alt="Conserva" width="195" height="116" />
                )}
            </header>
            <div className="account-page__body">
                <h1 className="account-page__title">{title}</h1>
                {children}
            </div>
        </main>
    );
}

export default AccountPage;
