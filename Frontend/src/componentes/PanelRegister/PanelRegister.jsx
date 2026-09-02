
import './PanelRegister.css';
function PanelRegister() {
  return (
    <div className="panel-register">
      <h2>Register</h2>
      <form className="register-form">
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" name="username" required />
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" required />
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <button type="submit">Register</button>
        <a href="/login">Already have an account? Login</a>
      </form>
    </div>
  );
}

export default PanelRegister;