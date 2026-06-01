import { useMemo, useState } from 'react';
import { compareMenuCategory, menuCategories } from '../../utils/menuCatalog';
import { getMenuImage } from '../../utils/menuImages';
import MenuCard from './MenuCard';
import './MenuSection.css';

const categories = ['Tutti', ...menuCategories];

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
        const categoryComparison = compareMenuCategory(
          currentPiatto.categoria,
          nextPiatto.categoria
        );

        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return currentPiatto.nome.localeCompare(nextPiatto.nome, 'it');
      })
      .map((piatto) => ({
        ...piatto,
        immagine: getMenuImage(piatto.immagine),
      }));
  }, [activeCategory, piatti, searchTerm, showVegOnly]);

  const groupedPiatti = useMemo(() => {
    return categories
      .filter((category) => category !== 'Tutti')
      .map((category) => ({
        category,
        piatti: filteredPiatti.filter((piatto) => piatto.categoria === category),
      }))
      .filter((group) => group.piatti.length > 0);
  }, [filteredPiatti]);

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

      <div className="menu-category-sections">
        {groupedPiatti.map((group) => (
          <section className="menu-category-section" key={group.category}>
            <div className="menu-category-heading">
              <div>
                <h2>{group.category}</h2>
              </div>
            </div>

            <div className="menu-grid">
              {group.piatti.map((piatto) => (
                <MenuCard key={piatto.id} piatto={piatto} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filteredPiatti.length === 0 && (
        <p className="menu-empty-state">Nessun piatto trovato con questi filtri.</p>
      )}
    </section>
  );
};

export default MenuSection;
