import PanelLogin from '../../components/usuario/PanelLogin/PanelLogin.jsx';
import Footer from '../../components/shared/Footer/Footer.jsx';
import Header from '../../components/shared/Header/Header.jsx';

import './Login.css';
function Login() {
  return (
    <div>

      <Header />
      
      <section className="body-login">
        <div className="main-content-login">
          <PanelLogin />
        </div>
      </section>

      <Footer />

    </div>
  );
}

export default Login;
