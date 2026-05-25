import { useState } from 'react';
import { apiRequest } from '../api/client';
import './AdminEmployees.css';

const AdminEmployees = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cuoco',
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
      const employee = await apiRequest('/auth/employees', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSuccessMessage(`Utenza ${employee.role} creata per ${employee.name}.`);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'cuoco',
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-employees-page" aria-labelledby="admin-employees-title">
      <div className="admin-employees-header">
        <span className="admin-employees-kicker">ADMIN</span>
        <h1 id="admin-employees-title">Crea Utenza Dipendente</h1>
        <p>Gli account creati qui possono accedere alle aree dedicate al proprio ruolo.</p>
      </div>

      <form className="admin-employees-form" onSubmit={handleSubmit}>
        <div className="admin-employees-field">
          <label htmlFor="employee-name">Nome completo</label>
          <input
            id="employee-name"
            type="text"
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
          />
        </div>

        <div className="admin-employees-field">
          <label htmlFor="employee-email">Email</label>
          <input
            id="employee-email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </div>

        <div className="admin-employees-field">
          <label htmlFor="employee-password">Password temporanea</label>
          <input
            id="employee-password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            required
          />
        </div>

        <div className="admin-employees-field">
          <label htmlFor="employee-role">Ruolo</label>
          <select
            id="employee-role"
            value={formData.role}
            onChange={(event) => updateField('role', event.target.value)}
          >
            <option value="cuoco">Cuoco</option>
            <option value="cameriere">Cameriere</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {errorMessage && <p className="admin-employees-message error">{errorMessage}</p>}
        {successMessage && <p className="admin-employees-message success">{successMessage}</p>}

        <button className="admin-employees-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creazione in corso...' : 'Crea utenza'}
        </button>
      </form>
    </section>
  );
};

export default AdminEmployees;
