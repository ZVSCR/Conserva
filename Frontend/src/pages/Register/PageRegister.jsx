import PanelRegister from "../../components/usuario/PanelRegister/PanelRegister";
import AccountPage from "../../components/usuario/AccountPage/AccountPage";

function Register() {
    return (
        <AccountPage title="Crie uma nova conta">
            <PanelRegister />
        </AccountPage>
    );
}

export default Register;
