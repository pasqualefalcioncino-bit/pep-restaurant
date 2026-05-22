import { useState } from 'react';
import { apiRequest, saveAuthSession } from '../../api/client';
import './LoginForm.css';

const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const updateField = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      saveAuthSession(data);
      setSuccessMessage(`Accesso effettuato. Benvenuto, ${data.user.name}!`);

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h1>Bentornato</h1>
        <p>Accedi per gestire prenotazioni, ordini e preferenze.</p>
      </div>
      
      <form className="auth-box" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            required
          />
        </div>

        {errorMessage && <p className="auth-message error">{errorMessage}</p>}
        {successMessage && <p className="auth-message success">{successMessage}</p>}

        <button className="btn-login" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
        </button>
        <button type="button" className="forgot-link" onClick={onSwitchToRegister}>
          Non hai un account? Registrati
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
