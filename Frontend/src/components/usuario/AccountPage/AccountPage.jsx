import AppHeader from '../../shared/AppHeader/AppHeader';
import conservaLogo from '../../../assets/Account/conserva-logo.svg';
import './AccountPage.css';

function AccountPage({ title, profile = false, children }) {
    return (
        <main className={profile ? 'account-page' : 'account-page account-page--auth'}>
            {profile ? <AppHeader accountTitle={title} /> : (
                <header className="account-page__header">
                    <img src={conservaLogo} alt="Conserva" width="195" height="116" />
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
