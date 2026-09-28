import PanelLogin from '../../componentes/PanelLogin/PanelLogin.jsx';
import Footer from '../../componentes/Footer/Footer.jsx';
import Header from '../../componentes/Header/Header.jsx';

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