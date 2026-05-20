import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './views/Home';
import Login from './views/Login';
import Register from './views/Register';
import Menu from './views/Menu';
import Prenota from './views/Prenota';
import Eventi from './views/Eventi';
import Contatti from './views/Contatti';
import './index.css';

function App() {
  const [page, setPage] = useState('home');
  const [pageRefreshKey, setPageRefreshKey] = useState(0);
  const [eventBookingDraft, setEventBookingDraft] = useState(null);

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
    }

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEventBooking = (bookingDraft) => {
    setEventBookingDraft(bookingDraft);
    setPage('prenota');
    setPageRefreshKey((currentKey) => currentKey + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let content = <Home onNavigate={navigateTo} />;

  if (page === 'login') {
    content = <Login onSwitchToRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    content = <Register onSwitchToLogin={() => setPage('login')} />;
  }

  if (page === 'menu') {
    content = <Menu />;
  }

  if (page === 'prenota') {
    content = <Prenota eventBookingDraft={eventBookingDraft} />;
  }

  if (page === 'eventi') {
    content = <Eventi onBookEvent={startEventBooking} />;
  }

  if (page === 'contatti') {
    content = <Contatti />;
  }

  return (
    <div className="app-shell">
      <Navbar
        onLoginClick={() => setPage('login')}
        isLoginPage={page === 'login' || page === 'register'}
        onGoHome={goHome}
        onNavigate={navigateTo}
        currentPage={page}
      />
      <main className="app-main" key={`${page}-${pageRefreshKey}`}>
        {content}
      </main>
      <Footer />
    </div>
  );
}

export default App;
