import './LoginForm.css';

const LoginForm = ({ onSwitchToRegister }) => {
  return (
    <div className="login-card">
      <div className="login-header">
        <h1>Bentornato</h1>
        <p>Accedi per gestire prenotazioni, ordini e preferenze.</p>
      </div>
      
      <div className="auth-box">
        <div className="input-group">
          <label>Email</label>
          <input type="email" />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input type="password"  />
        </div>
        <button className="btn-login">Accedi</button>
        <button type="button" className="forgot-link" onClick={onSwitchToRegister}>
          Non hai un account? Registrati
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
