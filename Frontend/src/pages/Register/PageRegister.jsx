import PanelRegister from "../../components/usuario/PanelRegister/PanelRegister";
import AccountPage from "../../components/usuario/AccountPage/AccountPage";

function Register() {
    return (
        <AccountPage title="Registre sua conta" backTo="/login">
            <PanelRegister />
        </AccountPage>
    );
}

export default Register;
