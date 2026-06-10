import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import MenuSection from '../components/menu/MenuSection';
import useAutoDismiss from '../hooks/useAutoDismiss';
import './Menu.css';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useAutoDismiss(errorMessage, setErrorMessage);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await apiRequest('/menu');

        const mappedMenuItems = data.map((item) => ({
          id: item.id,
          nome: item.name,
          categoria: item.category,
          descrizione: item.description || 'Descrizione non disponibile.',
          prezzo: item.price,
          tempo: item.prep_time || 0,
          immagine: item.image || '',
          veg: item.veg || false,
        }));

        setMenuItems(mappedMenuItems);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenu();
  }, []);

  if (isLoading) {
    return (
      <div className="menu-page">
        <div className="menu-page-state">
          <p>Caricamento menu...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="menu-page">
        <div className="menu-page-state menu-page-state-error">
          <p>Errore caricamento menu: {errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <MenuSection piatti={menuItems} />
    </div>
  );
};

export default Menu;
