import logo from '../../assets/images/brand/logo.png';
import './Navbar.css';

const Navbar = ({ onLoginClick, isLoginPage, onGoHome, onNavigate, currentPage }) => {
  const menuItems = [
    { label: 'Home', page: 'home' },
    { label: 'Menu', page: 'menu' },
    { label: 'Prenota', page: 'prenota' },
    { label: 'Eventi', page: 'eventi' },
    { label: 'Contatti', page: 'contatti' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={logo} alt="Logo Ristorante Da Spike" className="navbar-logo-img" />
          <h1 className="navbar-logo">Ristorante Da Peppe e Spike</h1>
        </div>
        <div className="navbar-nav">
          {menuItems.map((item) => {
            return (
              <button
                key={item.page}
                type="button"
                onClick={item.page === 'home' ? onGoHome : () => onNavigate(item.page)}
                className={`navbar-nav-link navbar-nav-button${currentPage === item.page ? ' active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="navbar-menu">
          {!isLoginPage && onLoginClick && (
            <button className="navbar-button" type="button" onClick={onLoginClick}>
              Accedi
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
