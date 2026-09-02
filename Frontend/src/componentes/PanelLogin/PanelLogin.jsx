
import './PanelLogin.css'
function PanelLogin() {
    return (
        <div className="panel-login">
            <h2>Login</h2>
            <form className="login-form">
                <label htmlFor="username">Usuário/email:</label>
                <input type="text" id="username" name="username" placeholder="Usuário/email" />
                <label htmlFor="password">Senha:</label>
                <input type="password" id="password" name="password" placeholder="Senha" />
                <button>Entrar</button>
                <a href="/registrar">Registrar</a>
            </form>
        </div>
    );
}

export default PanelLogin;