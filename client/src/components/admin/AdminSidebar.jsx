import './AdminSidebar.css';

const adminItems = [
  { label: 'Dashboard', page: 'admin-dashboard' },
  { label: 'Prenotazioni', page: 'admin-prenotazioni' },
  { label: 'Menu', page: 'admin-menu' },
  { label: 'Tavoli', page: 'admin-tavoli' },
  { label: 'Clienti', page: 'admin-clienti' },
  { label: 'Staff', page: 'admin-staff' },
  { label: 'Dipendenti', page: 'admin-dipendenti' },
  { label: 'Inventario', page: 'admin-inventario' },
  { label: 'Cassa', page: 'admin-cassa' },
];

const AdminSidebar = ({ currentPage, isOpen, onNavigate, onToggle }) => {
  return (
    <aside className={`admin-sidebar${isOpen ? '' : ' collapsed'}`} aria-label="Menu amministratore">
      <div className="admin-sidebar-header">
        {isOpen && <span className="admin-sidebar-kicker">ADMIN</span>}
        <button
          className="admin-sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Chiudi menu amministratore' : 'Apri menu amministratore'}
        >
          {isOpen ? '<' : '>'}
        </button>
      </div>

      {isOpen && (
        <nav className="admin-sidebar-nav">
          {adminItems.map((item) => (
            <button
              key={item.page}
              type="button"
              className={`admin-sidebar-link${currentPage === item.page ? ' active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
};

export default AdminSidebar;
