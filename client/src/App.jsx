import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './views/Home';
import Login from './views/Login';
import Register from './views/Register';
import Menu from './views/Menu';
import Prenota from './views/Prenota';
import Contatti from './views/Contatti';
import AdminBookings from './views/AdminBookings';
import CustomerBookings from './views/CustomerBookings';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminMenu from './views/admin/AdminMenu';
import AdminTables from './views/admin/AdminTables';
import AdminCustomers from './views/admin/AdminCustomers';
import AdminStaff from './views/admin/AdminStaff';
import AdminInventory from './views/admin/AdminInventory';
import CookDashboard from './views/CookDashboard';
import WaiterOrders from './views/WaiterOrders';
import WaiterWalkIns from './views/WaiterWalkIns';
import { clearAuthSession, getAuthUser } from './api/client';
import Profile from './views/Profile';

const staticPages = {
  menu: <Menu />,
  contatti: <Contatti />,
  'mie-prenotazioni': <CustomerBookings />,
  'admin-prenotazioni': <AdminBookings />,
  'admin-menu': <AdminMenu />,
  'admin-tavoli': <AdminTables />,
  'admin-clienti': <AdminCustomers />,
  'admin-staff': <AdminStaff />,
  'admin-inventario': <AdminInventory />,
  cuoco: <CookDashboard />,
  'cuoco-gestione': <CookDashboard mode="management" />,
  ordini: <WaiterOrders />,
};

const roleLandingPages = {
  cuoco: 'cuoco',
  cameriere: 'ordini',
};

function App() {
  const [page, setPage] = useState('home');
  const [pageRefreshKey, setPageRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(() => getAuthUser());
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

  const completeBooking = () => {
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
    content = <Prenota onBookingSuccess={completeBooking} />;
  }

  if (page === 'profilo') {
    content = <Profile onProfileUpdate={setCurrentUser} />;
  }

  if (page === 'admin-dashboard') {
    content = <AdminDashboard onNavigate={navigateTo} />;
  }

  if (page === 'walk-in') {
    content = <WaiterWalkIns onNavigate={navigateTo} />;
  }

  return (
    <div className="app-shell">
      <Navbar
        onLoginClick={() => setPage('login')}
        isLoginPage={page === 'login' || page === 'register'}
        onGoHome={goHome}
        onNavigate={navigateTo}
        currentPage={page}
        currentUser={currentUser}
        onProfileClick={() => setPage('profilo')}
        onLogout={() => {
          clearAuthSession();
          setCurrentUser(null);
          setPage('home');
        }}
      />
      <div className={`app-content${currentUser?.role === 'admin' ? ' with-admin-theme' : ''}`}>
        <main className="app-main" key={`${page}-${pageRefreshKey}`}>
          {content}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;