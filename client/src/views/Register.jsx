import RegisterForm from '../components/auth/RegisterForm';
import './AuthPages.css';

const Register = ({ onSwitchToLogin }) => {
  return (
    <div className="register-page">
      <RegisterForm onSwitchToLogin={onSwitchToLogin} />
    </div>
  );
};

export default Register;
