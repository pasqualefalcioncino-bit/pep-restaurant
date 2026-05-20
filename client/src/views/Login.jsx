import LoginForm from '../components/auth/LoginForm';

const Login = ({ onSwitchToRegister }) => {
  return (
    <div className="login-page">
      <LoginForm onSwitchToRegister={onSwitchToRegister} />
    </div>
  );
};

export default Login;
