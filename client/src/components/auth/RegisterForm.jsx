import { useState } from 'react';
import { apiRequest } from '../../api/client';
import useAutoDismiss from '../../hooks/useAutoDismiss';
import './AuthForm.css';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      setSuccessMessage('Registrazione completata. Ora puoi accedere.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-card" aria-labelledby="register-title">
      <div className="auth-intro">
        <h1 id="register-title">Crea account</h1>
        <p>Apri il tuo profilo per prenotare più velocemente e seguire le tue richieste.</p>
      </div>

      <form className="auth-box" onSubmit={handleSubmit}>
        <div className="auth-field-row">
          <label className="auth-field" htmlFor="register-first-name">
            <span>Nome</span>
            <input
              id="register-first-name"
              type="text"
              value={formData.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              autoComplete="given-name"
              required
            />
          </label>

          <label className="auth-field" htmlFor="register-last-name">
            <span>Cognome</span>
            <input
              id="register-last-name"
              type="text"
              value={formData.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              autoComplete="family-name"
              required
            />
          </label>
        </div>

        <label className="auth-field" htmlFor="register-email">
          <span>Email</span>
          <input
            id="register-email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="auth-field" htmlFor="register-password">
          <span>Password</span>
          <input
            id="register-password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {errorMessage && <p className="auth-message error">{errorMessage}</p>}
        {successMessage && <p className="auth-message success">{successMessage}</p>}

        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
        </button>

        <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
          Hai già un account? Accedi
        </button>
      </form>
    </section>
  );
};

export default RegisterForm;
