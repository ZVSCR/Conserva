import { Link } from 'react-router-dom';
import AppHeader from '../../shared/AppHeader/AppHeader';
import backArrow from '../../../assets/Account/voltar.svg';
import './AccountPage.css';

function AccountPage({ title, backTo, profile = false, children }) {
    return (
        <main className="account-page">
            {profile ? <AppHeader accountTitle={title} /> : (
                <header className="account-page__header">
                    {backTo && (
                        <Link to={backTo} className="account-page__back" aria-label="Voltar para o login">
                            <img src={backArrow} alt="" />
                        </Link>
                    )}
                    <span className="account-page__brand">Conserva</span>
                </header>
            )}
            <div className="account-page__body">
                {!profile && <h1 className="account-page__title">{title}</h1>}
                {children}
            </div>
        </main>
    );
}

export default AccountPage;
