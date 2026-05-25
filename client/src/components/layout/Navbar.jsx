import logo from '../../assets/images/brand/logo.png';
import './Navbar.css';

const Navbar = ({
  onLoginClick,
  isLoginPage,
  onGoHome,
  onNavigate,
  currentPage,
  currentUser,
  onLogout,
}) => {
  const displayUserName = currentUser?.name || currentUser?.role || '';
  const menuItems = [
    { label: 'Home', page: 'home' },
    { label: 'Menu', page: 'menu' },
    { label: 'Prenota', page: 'prenota' },
    { label: 'Eventi', page: 'eventi' },
    { label: 'Contatti', page: 'contatti' },
  ];
  const visibleMenuItems = [...menuItems];

  if (currentUser?.role === 'cuoco') {
    visibleMenuItems.push({ label: 'Cucina', page: 'cuoco' });
  }

  if (currentUser?.role === 'cameriere') {
    visibleMenuItems.push({ label: 'Ordini', page: 'ordini' });
  }

  if (currentUser?.role === 'cliente') {
    visibleMenuItems.push({ label: 'Prenotazioni', page: 'mie-prenotazioni' });
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={logo} alt="Logo Ristorante Da Spike" className="navbar-logo-img" />
          <h1 className="navbar-logo">Ristorante Da Peppe e Spike</h1>
        </div>
        <div className="navbar-nav">
          {visibleMenuItems.map((item) => {
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
          {currentUser ? (
            <div className="navbar-user">
              <span className="navbar-user-name">
                {displayUserName}
              </span>
              <button className="navbar-button" type="button" onClick={onLogout}>
                Esci
              </button>
            </div>
          ) : !isLoginPage && onLoginClick && (
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
