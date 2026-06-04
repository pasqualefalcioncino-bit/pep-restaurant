import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminSidebar from './components/admin/AdminSidebar';
import Home from './views/Home';
import Login from './views/Login';
import Register from './views/Register';
import Menu from './views/Menu';
import Prenota from './views/Prenota';
import Eventi from './views/Eventi';
import Contatti from './views/Contatti';
import AdminBookings from './views/AdminBookings';
import AdminEmployees from './views/AdminEmployees';
import CustomerBookings from './views/CustomerBookings';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminMenu from './views/admin/AdminMenu';
import AdminTables from './views/admin/AdminTables';
import AdminCustomers from './views/admin/AdminCustomers';
import AdminStaff from './views/admin/AdminStaff';
import AdminInventory from './views/admin/AdminInventory';
import AdminCashRegister from './views/admin/AdminCashRegister';
import CookDashboard from './views/CookDashboard';
import WaiterOrders from './views/WaiterOrders';
import { clearAuthSession, getAuthUser } from './api/client';

const staticPages = {
  menu: <Menu />,
  contatti: <Contatti />,
  'mie-prenotazioni': <CustomerBookings />,
  'admin-prenotazioni': <AdminBookings />,
  'admin-dipendenti': <AdminEmployees />,
  'admin-menu': <AdminMenu />,
  'admin-tavoli': <AdminTables />,
  'admin-clienti': <AdminCustomers />,
  'admin-staff': <AdminStaff />,
  'admin-inventario': <AdminInventory />,
  'admin-cassa': <AdminCashRegister />,
  cuoco: <CookDashboard />,
  ordini: <WaiterOrders />,
};

const roleLandingPages = {
  cuoco: 'cuoco',
  cameriere: 'ordini',
};

function App() {
  const [page, setPage] = useState('home');
  const [pageRefreshKey, setPageRefreshKey] = useState(0);
  const [eventBookingDraft, setEventBookingDraft] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => getAuthUser());
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(true);
  const [pageAfterLogin, setPageAfterLogin] = useState(null);

  const goHome = () => {
    if (page === 'home') {
      setPageRefreshKey((currentKey) => currentKey + 1);
    }

    setPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (nextPage) => {
    if (nextPage === page) {
      setPageRefreshKey((currentKey) => currentKey + 1);
    }

    if (nextPage === 'prenota') {
      setEventBookingDraft(null);

      if (!currentUser) {
        setPageAfterLogin('prenota');
        setPage('login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEventBooking = (bookingDraft) => {
    if (!currentUser) {
      setEventBookingDraft(bookingDraft);
      setPageAfterLogin('prenota');
      setPage('login');
      setPageRefreshKey((currentKey) => currentKey + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setEventBookingDraft(bookingDraft);
    setPage('prenota');
    setPageRefreshKey((currentKey) => currentKey + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeBooking = () => {
    setEventBookingDraft(null);
    setPage('home');
    setPageRefreshKey((currentKey) => currentKey + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let content = staticPages[page] || <Home onNavigate={navigateTo} />;

  if (page === 'login') {
    content = (
      <Login
        onSwitchToRegister={() => setPage('register')}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setPage(roleLandingPages[user.role] || pageAfterLogin || 'home');
          setPageAfterLogin(null);
        }}
      />
    );
  }

  if (page === 'register') {
    content = <Register onSwitchToLogin={() => setPage('login')} />;
  }

  if (page === 'prenota') {
    content = (
      <Prenota
        eventBookingDraft={eventBookingDraft}
        onBookingSuccess={completeBooking}
      />
    );
  }

  if (page === 'eventi') {
    content = <Eventi onBookEvent={startEventBooking} />;
  }

  if (page === 'admin-dashboard') {
    content = <AdminDashboard onNavigate={navigateTo} />;
  }

  const showAdminSidebar = currentUser?.role === 'admin';

  return (
    <div className="app-shell">
      <Navbar
        onLoginClick={() => setPage('login')}
        isLoginPage={page === 'login' || page === 'register'}
        onGoHome={goHome}
        onNavigate={navigateTo}
        currentPage={page}
        currentUser={currentUser}
        onLogout={() => {
          clearAuthSession();
          setCurrentUser(null);
          setPage('home');
        }}
      />
      <div className={`app-content${showAdminSidebar ? ' with-admin-sidebar' : ''}`}>
        {showAdminSidebar && (
          <AdminSidebar
            currentPage={page}
            isOpen={isAdminSidebarOpen}
            onNavigate={navigateTo}
            onToggle={() => setIsAdminSidebarOpen((currentValue) => !currentValue)}
          />
        )}
        <main className="app-main" key={`${page}-${pageRefreshKey}`}>
          {content}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
