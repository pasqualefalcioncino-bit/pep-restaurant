import RegisterForm from '../components/auth/RegisterForm';

const Register = ({ onSwitchToLogin }) => {
  return (
    <div className="register-page">
      <RegisterForm onSwitchToLogin={onSwitchToLogin} />
    </div>
  );
};

export default Register;
