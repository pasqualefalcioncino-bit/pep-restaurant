import LoginForm from '../components/auth/LoginForm';

const Login = ({ onSwitchToRegister, onLoginSuccess }) => {
  return (
    <div className="login-page">
      <LoginForm
        onSwitchToRegister={onSwitchToRegister}
        onLoginSuccess={onLoginSuccess}
      />
    </div>
  );
};

export default Login;
