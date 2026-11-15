import conservaLogo from '../../../assets/Account/conserva-logo.svg';
import './AccountPage.css';

function AccountPage({ title, children }) {
    return (
        <main className="account-page account-page--auth">
            <header className="account-page__header">
                <img src={conservaLogo} alt="Conserva" width="195" height="116" />
            </header>
            <div className="account-page__body">
                <h1 className="account-page__title">{title}</h1>
                {children}
            </div>
        </main>
    );
}

export default AccountPage;
