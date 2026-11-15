import PanelUserData from '../../components/usuario/PanelUserData/PanelUserData';
import AccountPage from '../../components/usuario/AccountPage/AccountPage';

function UserData() {
    return (
        <AccountPage title="Altere seus dados" className="user-data" voltarAoEstoque>
            <PanelUserData />
        </AccountPage>
    );
}

export default UserData;
