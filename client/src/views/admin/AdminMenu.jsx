import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock3,
  ImagePlus,
  Leaf,
  ListFilter,
  Pencil,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { API_URL, apiRequest, getAuthToken } from '../../api/client';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import useAutoDismiss from '../../hooks/useAutoDismiss';
import { menuCategories } from '../../utils/menuCatalog';
import { getMenuImage } from '../../utils/menuImages';
import { formatEuroPrice } from '../../utils/priceFormatter';
import './AdminMenu.css';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  prep_time: '',
  image: '',
  veg: false,
  available: true,
};

const filterCategories = ['Tutti', ...menuCategories];
const allowedImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const imageInputRef = useRef(null);

  useAutoDismiss(errorMessage, setErrorMessage);
  useAutoDismiss(successMessage, setSuccessMessage);

  const loadMenu = async () => {
    try {
      const data = await apiRequest('/menu');
      setMenuItems(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const filteredMenuItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'Tutti' || item.category === activeCategory;
      const matchesVeg = !showVegOnly || item.veg;
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        (item.description || '').toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesVeg && matchesSearch;
    });
  }, [activeCategory, menuItems, searchTerm, showVegOnly]);
  const selectedItemIdSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);
  const selectedMenuItems = useMemo(
    () => menuItems.filter((item) => selectedItemIdSet.has(item.id)),
    [menuItems, selectedItemIdSet]
  );
  const menuSummary = useMemo(() => ({
    available: menuItems.filter((item) => item.available !== false).length,
    veg: menuItems.filter((item) => item.veg).length,
    categories: new Set(menuItems.map((item) => item.category).filter(Boolean)).size,
  }), [menuItems]);
  const areAllFilteredItemsSelected =
    filteredMenuItems.length > 0 && filteredMenuItems.every((item) => selectedItemIdSet.has(item.id));

  const updateField = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingItemId(null);
    setSelectedItemIds([]);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
      prep_time: item.prep_time || '',
      image: item.image || '',
      veg: Boolean(item.veg),
      available: item.available !== false,
    });
    setErrorMessage('');
    setSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds((currentIds) =>
      currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId]
    );
  };

  const toggleAllFilteredItems = () => {
    setSelectedItemIds((currentIds) => {
      if (areAllFilteredItemsSelected) {
        return currentIds.filter((id) => !filteredMenuItems.some((item) => item.id === id));
      }

      return [...new Set([...currentIds, ...filteredMenuItems.map((item) => item.id)])];
    });
  };

  const startSelectedEdit = () => {
    if (selectedMenuItems.length !== 1) {
      return;
    }

    startEdit(selectedMenuItems[0]);
  };

  const uploadMenuImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setErrorMessage('Puoi caricare solo immagini PNG, JPG, WEBP o AVIF.');
      setSuccessMessage('');
      event.target.value = '';
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploadingImage(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/menu/upload-image`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: uploadData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Errore caricamento immagine');
      }

      const data = await response.json();
      updateField('image', data.fileName);
      setSuccessMessage(`Immagine "${data.fileName}" caricata.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const submitMenuItem = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      ...formData,
      price: Number(formData.price),
      prep_time: Number(formData.prep_time) || 0,
    };

    try {
      const savedItem = editingItemId
        ? await apiRequest(`/menu/${editingItemId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiRequest('/menu', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      if (editingItemId) {
        setMenuItems((currentItems) =>
          currentItems.map((item) => (item.id === savedItem.id ? savedItem : item))
        );
        setSuccessMessage(`Piatto "${savedItem.name}" aggiornato.`);
      } else {
        setMenuItems((currentItems) => [...currentItems, savedItem]);
        setSuccessMessage(`Piatto "${savedItem.name}" creato.`);
      }

      setFormData(emptyForm);
      setEditingItemId(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSelectedMenuItems = async () => {
    if (selectedMenuItems.length === 0) {
      return;
    }

    setDeletingItemId(selectedMenuItems[0].id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await Promise.all(
        selectedMenuItems.map((item) =>
          apiRequest(`/menu/${item.id}`, {
            method: 'DELETE',
          })
        )
      );

      setMenuItems((currentItems) =>
        currentItems.filter((item) => !selectedItemIdSet.has(item.id))
      );
      setSuccessMessage(`${selectedMenuItems.length} piatti eliminati.`);
      setSelectedItemIds([]);
      setItemToDelete(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-menu-page">
        <p className="admin-menu-state">Caricamento menu...</p>
      </section>
    );
  }

  return (
    <section className="admin-menu-page" aria-labelledby="admin-menu-title">
      <div className="admin-menu-header">
        <h1 id="admin-menu-title">Gestione Menu</h1>
      </div>

      <div className="admin-menu-stats" aria-label="Riepilogo menu">
        <article>
          <span>
            <UtensilsCrossed size={17} aria-hidden="true" />
            Totale
          </span>
          <strong>{menuItems.length}</strong>
        </article>
        <article>
          <span>
            <Clock3 size={17} aria-hidden="true" />
            Disponibili
          </span>
          <strong>{menuSummary.available}</strong>
        </article>
        <article>
          <span>
            <Leaf size={17} aria-hidden="true" />
            Vegetariani
          </span>
          <strong>{menuSummary.veg}</strong>
        </article>
        <article>
          <span>
            <ListFilter size={17} aria-hidden="true" />
            Categorie
          </span>
          <strong>{menuSummary.categories}</strong>
        </article>
      </div>

      {errorMessage && <p className="admin-menu-message error">Errore: {errorMessage}</p>}
      {successMessage && <p className="admin-menu-message success">{successMessage}</p>}

      <form className="admin-menu-form" onSubmit={submitMenuItem}>
        <div className="admin-menu-form-header">
          <h2>{editingItemId ? 'Modifica piatto' : 'Nuovo piatto'}</h2>
        </div>

        <div className="admin-menu-form-grid">
          <label>
            Nome
            <input
              type="text"
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
            />
          </label>

          <label>
            Categoria
            <select
              value={formData.category}
              onChange={(event) => updateField('category', event.target.value)}
              required
            >
              <option value="" disabled aria-label="Categoria non selezionata" />
              {menuCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Prezzo
            <div className="admin-menu-input-unit">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={(event) => updateField('price', event.target.value)}
                required
              />
              <span aria-hidden="true">€</span>
            </div>
          </label>

          <label>
            Tempo preparazione
            <div className="admin-menu-input-unit">
              <input
                type="number"
                min="0"
                value={formData.prep_time}
                onChange={(event) => updateField('prep_time', event.target.value)}
              />
              <span>minuti</span>
            </div>
          </label>

          <label>
            Immagine piatto
            <div className="admin-menu-image-field">
              <input
                type="text"
                value={formData.image}
                placeholder=""
                readOnly
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                aria-label="Carica immagine piatto"
              >
                {isUploadingImage ? '...' : <ImagePlus size={18} aria-hidden="true" />}
              </button>
              <input
                ref={imageInputRef}
                className="admin-menu-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={uploadMenuImage}
              />
            </div>
          </label>

          <label className={`admin-menu-check ${formData.veg ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={formData.veg}
              onChange={(event) => updateField('veg', event.target.checked)}
            />
            Vegetariano
          </label>
        </div>

        <label className="admin-menu-description">
          Descrizione
          <textarea
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows="4"
          />
        </label>

        <div className="admin-menu-form-actions">
          <button className="admin-menu-submit" type="submit" disabled={isSubmitting}>
            <UtensilsCrossed size={17} aria-hidden="true" />
            {isSubmitting ? 'Salvataggio...' : editingItemId ? 'Aggiorna piatto' : 'Crea piatto'}
          </button>
          {editingItemId && (
            <button className="admin-menu-cancel-edit" type="button" onClick={resetForm}>
              <X size={16} aria-hidden="true" />
              Annulla modifica
            </button>
          )}
        </div>
      </form>

      <div className="admin-menu-toolbar">
        <label className="admin-menu-search-field" htmlFor="admin-menu-search">
          <Search size={17} aria-hidden="true" />
          <input
            id="admin-menu-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nome, categoria o descrizione"
          />
        </label>

        <div className="admin-menu-filters" aria-label="Filtri menu admin">
          <div className="admin-menu-filter-group" aria-label="Filtra per categoria">
            {filterCategories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            className={`admin-menu-veg-filter ${showVegOnly ? 'active' : ''}`}
            type="button"
            onClick={() => setShowVegOnly((currentValue) => !currentValue)}
          >
            Solo veg
          </button>
        </div>
      </div>

      <div className="admin-menu-bulk-actions">
        <button type="button" onClick={toggleAllFilteredItems} disabled={filteredMenuItems.length === 0}>
          {areAllFilteredItemsSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
        </button>
        <button type="button" onClick={startSelectedEdit} disabled={selectedItemIds.length !== 1}>
          Modifica selezionato
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button
          className="danger"
          type="button"
          onClick={() => setItemToDelete({ bulk: true })}
          disabled={selectedItemIds.length === 0}
        >
          <Trash2 size={15} aria-hidden="true" />
          Elimina selezionati
        </button>
      </div>

      {filteredMenuItems.length === 0 ? (
        <p className="admin-menu-state">Nessun piatto trovato.</p>
      ) : (
        <div className="admin-menu-table-wrap">
          <table className="admin-menu-table">
            <thead>
              <tr>
                <th aria-label="Selezione" />
                <th>Piatto</th>
                <th>Categoria</th>
                <th>Prezzo</th>
                <th>Tempo</th>
                <th>Veg</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenuItems.map((item) => {
                const menuImage = getMenuImage(item.image);

                return (
                  <tr key={item.id}>
                    <td data-label="Seleziona">
                      <label className="admin-menu-select-box">
                        <input
                          type="checkbox"
                          checked={selectedItemIdSet.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          aria-label={`Seleziona ${item.name}`}
                        />
                        <span aria-hidden="true" />
                      </label>
                    </td>
                    <td data-label="Piatto">
                      <div className="admin-menu-dish">
                        <div className="admin-menu-dish-image">
                          {menuImage ? (
                            <img src={menuImage} alt={item.name} />
                          ) : (
                            <span aria-hidden="true">{item.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.description || '-'}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Categoria">{item.category}</td>
                    <td data-label="Prezzo">{formatEuroPrice(item.price)}</td>
                    <td data-label="Tempo">{item.prep_time || 0} min</td>
                    <td data-label="Veg">
                      <span className={`admin-menu-veg-chip ${item.veg ? 'active' : ''}`}>
                        {item.veg ? 'Si' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {itemToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente i piatti selezionati?"
          summaryItems={selectedMenuItems.map((item) => ({
            id: item.id,
            title: item.name,
            details: [item.category, formatEuroPrice(item.price)],
            imageSrc: getMenuImage(item.image),
            imageAlt: item.name,
            fallbackText: item.name.charAt(0),
          }))}
          isDeleting={deletingItemId !== null}
          onCancel={() => setItemToDelete(null)}
          onConfirm={deleteSelectedMenuItems}
          confirmIcon={<Trash2 size={16} aria-hidden="true" />}
        />
      )}
    </section>
  );
};

export default AdminMenu;
