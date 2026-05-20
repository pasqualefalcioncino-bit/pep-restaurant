import MenuSection from '../components/menu/MenuSection';
import menuItems from '../data/menuItems.json';

const Menu = () => {
  return (
    <div className="menu-page">
      <MenuSection piatti={menuItems} />
    </div>
  );
};

export default Menu;
