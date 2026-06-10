import { useState } from 'react';
import { apiRequest, saveAuthSession } from '../../api/client';
import useAutoDismiss from '../../hooks/useAutoDismiss';
import './AuthForm.css';

const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useAutoDismiss(errorMessage, setErrorMessage);
  useAutoDismiss(successMessage, setSuccessMessage);

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
      const sessionData = {
        ...data,
        user: {
          ...data.user,
          email: data.user.email || formData.email,
        },
      };

      saveAuthSession(sessionData);
      setSuccessMessage(`Accesso effettuato. Benvenuto, ${sessionData.user.name}!`);

      if (onLoginSuccess) {
        onLoginSuccess(sessionData.user);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <div className="auth-intro">
        <h1 id="login-title">Bentornato</h1>
        <p>Accedi per gestire prenotazioni, ordini e preferenze.</p>
      </div>

      <form className="auth-box" onSubmit={handleSubmit}>
        <label className="auth-field" htmlFor="login-email">
          <span>Email</span>
          <input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="auth-field" htmlFor="login-password">
          <span>Password</span>
          <input
            id="login-password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage && <p className="auth-message error">{errorMessage}</p>}
        {successMessage && <p className="auth-message success">{successMessage}</p>}

        <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
        </button>
        <button type="button" className="auth-switch-btn" onClick={onSwitchToRegister}>
          Non hai un account? Registrati
        </button>
      </form>
    </section>
  );
};

export default LoginForm;
