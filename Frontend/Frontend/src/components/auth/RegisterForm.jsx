import { useState } from 'react';
import './RegisterForm.css';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [role, setRole] = useState('user');
  const roles = [
    { value: 'user', label: 'Cliente', icon: '👤' },
    { value: 'cook', label: 'Cuoco', icon: '👨‍🍳' },
    { value: 'admin', label: 'Admin', icon: '🛡️' }
  ];
  
  return (
    <div className="register-card">
      <div className="register-header">
        <h1>Crea account</h1>
        <p>Accedi per gestire prenotazioni, ordini e preferenze.</p>
      </div>
      
      <form className="auth-box" onSubmit={(event) => event.preventDefault()}>
        <div className="input-group">
          <label>Nome</label>
          <input type="text" />
        </div>

        <div className="input-group">
          <label>Cognome</label>
          <input type="text" />
        </div>
        
        <div className="input-group">
          <label>Email</label>
          <input type="email"  />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password"  />
        </div>

        <div className="role-group">
          <p className="role-label">Seleziona il tuo ruolo</p>
          <input type="hidden" name="role" value={role} />
          <div className="register-roles-container">
            {roles.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`register-role-card ${role === item.value ? 'register-role-card-active' : ''}`}
                onClick={() => setRole(item.value)}
              >
                <span className="register-role-icon">{item.icon}</span>
                <span className="register-role-name">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-register">Registrati</button>
        
        <button type="button" className="btn-outline-login" onClick={onSwitchToLogin}>
          Hai già un account? Accedi
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
