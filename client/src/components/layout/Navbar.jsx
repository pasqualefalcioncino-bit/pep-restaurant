import logo from '../../assets/images/brand/logo.png';
import { getRoleAvatar } from '../../utils/roleAvatars';
import './Navbar.css';

const Navbar = ({
  onLoginClick,
  isLoginPage,
  onGoHome,
  onNavigate,
  currentPage,
  currentUser,
  onProfileClick,
  onLogout,
}) => {
  const displayUserName = currentUser?.name || currentUser?.role || '';
  const userAvatar = currentUser?.avatar_url || getRoleAvatar(currentUser?.role);
  const publicMenuItems = [
    { label: 'Home', page: 'home' },
    { label: 'Menu', page: 'menu' },
    { label: 'Prenota', page: 'prenota' },
    { label: 'Contatti', page: 'contatti' },
  ];
  const menuItems = ['admin', 'cameriere', 'cuoco'].includes(currentUser?.role) ? [] : publicMenuItems;
  const roleMenuItems = [];

  if (currentUser?.role === 'admin') {
    roleMenuItems.push(
      { label: 'Dashboard', page: 'admin-dashboard' },
      { label: 'Prenotazioni', page: 'admin-prenotazioni' },
      { label: 'Menu', page: 'admin-menu' },
      { label: 'Tavoli', page: 'admin-tavoli' },
      { label: 'Clienti', page: 'admin-clienti' },
      { label: 'Staff', page: 'admin-staff' },
      { label: 'Inventario', page: 'admin-inventario' }
    );
  }

  if (currentUser?.role === 'cuoco') {
    roleMenuItems.push({ label: 'Cucina', page: 'cuoco' });
    roleMenuItems.push({ label: 'Gestione', page: 'cuoco-gestione' });
  }

  if (currentUser?.role === 'cameriere') {
    roleMenuItems.push({ label: 'Ordini', page: 'ordini' });
    roleMenuItems.push({ label: 'Walk-in', page: 'walk-in' });
  }

  if (currentUser?.role === 'cliente') {
    roleMenuItems.push({ label: 'Prenotazioni', page: 'mie-prenotazioni' });
  }

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

          {menuItems.length > 0 && roleMenuItems.length > 0 && (
            <span className="navbar-nav-divider" aria-hidden="true">|</span>
          )}

          {roleMenuItems.map((item) => {
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
              <button
                className={`navbar-profile-btn${currentPage === 'profilo' ? ' active' : ''}`}
                type="button"
                onClick={onProfileClick}
              >
              <span className="navbar-user-name">
                {displayUserName}
              </span>
              {userAvatar && (
                <img
                  className="navbar-user-avatar"
                  src={userAvatar}
                  alt={`Avatar ${currentUser.role}`}
                />
              )}
              </button>
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