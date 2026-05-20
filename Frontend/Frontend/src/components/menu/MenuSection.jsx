import { useMemo, useState } from 'react';
import { getMenuImage } from '../../utils/menuImages';
import MenuCard from './MenuCard';
import './MenuSection.css';

const categories = ['Tutti', 'Antipasti', 'Primi', 'Secondi', 'Dolci', 'Vini'];
const categoryOrder = {
  Antipasti: 1,
  Primi: 2,
  Secondi: 3,
  Dolci: 4,
  Vini: 5,
};

const MenuSection = ({ piatti }) => {
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPiatti = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return piatti
      .filter((piatto) => {
        const matchesCategory =
          activeCategory === 'Tutti' || piatto.categoria.toLowerCase() === activeCategory.toLowerCase();
        const matchesVeg = !showVegOnly || piatto.veg;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          piatto.nome.toLowerCase().includes(normalizedSearch) ||
          piatto.descrizione.toLowerCase().includes(normalizedSearch);

        return matchesCategory && matchesVeg && matchesSearch;
      })
      .sort((currentPiatto, nextPiatto) => {
        if (activeCategory !== 'Tutti') {
          return 0;
        }

        return (
          (categoryOrder[currentPiatto.categoria] || 99) -
          (categoryOrder[nextPiatto.categoria] || 99)
        );
      })
      .map((piatto) => ({
        ...piatto,
        immagine: getMenuImage(piatto.immagine),
      }));
  }, [activeCategory, piatti, searchTerm, showVegOnly]);

  return (
    <section className="menu-section" aria-labelledby="menu-title">
      <div className="menu-header">
        <span className="menu-kicker">CARTA</span>
        <h1 id="menu-title">Il Nostro Menu</h1>
        <p className="menu-intro">
          Una selezione che cambia con le stagioni, costruita su materie prime di filiera corta
          e tecniche tradizionali rivisitate.
        </p>
      </div>

      <div className="menu-filters" aria-label="Filtri menu">
        <div className="menu-filter-group">
          {categories.map((category) => (
            <button
              key={category}
              className={`menu-filter-btn ${activeCategory === category ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="menu-search-group">
          <button
            className={`menu-veg-toggle ${showVegOnly ? 'active' : ''}`}
            type="button"
            onClick={() => setShowVegOnly((currentValue) => !currentValue)}
          >
            🌿 Veg
          </button>

          <label className="menu-search-input">
            <span aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Cerca un piatto..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="menu-grid">
        {filteredPiatti.map((piatto) => (
          <MenuCard key={piatto.id} piatto={piatto} />
        ))}
      </div>

      {filteredPiatti.length === 0 && (
        <p className="menu-empty-state">Nessun piatto trovato con questi filtri.</p>
      )}
    </section>
  );
};

export default MenuSection;
