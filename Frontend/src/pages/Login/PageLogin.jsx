import PanelLogin from '../../components/usuario/PanelLogin/PanelLogin.jsx';
import AccountPage from '../../components/usuario/AccountPage/AccountPage.jsx';

function Login() {
  return (
    <AccountPage title="Entre com sua conta">
      <PanelLogin />
    </AccountPage>
  );
}

export default Login;
