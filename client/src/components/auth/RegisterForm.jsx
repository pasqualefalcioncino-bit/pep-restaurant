import { useState } from 'react';
import { apiRequest } from '../../api/client';
import './RegisterForm.css';

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
    <div className="register-card">
      <div className="register-header">
        <h1>Crea account</h1>
        <p>Accedi per gestire prenotazioni, ordini e preferenze.</p>
      </div>

      <form className="auth-box" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="register-first-name">Nome</label>
          <input
            id="register-first-name"
            type="text"
            value={formData.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="register-last-name">Cognome</label>
          <input
            id="register-last-name"
            type="text"
            value={formData.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            required
          />
        </div>

        {errorMessage && <p className="auth-message error">{errorMessage}</p>}
        {successMessage && <p className="auth-message success">{successMessage}</p>}

        <button type="submit" className="btn-register" disabled={isSubmitting}>
          {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
        </button>

        <button type="button" className="btn-outline-login" onClick={onSwitchToLogin}>
          Hai gia un account? Accedi
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
