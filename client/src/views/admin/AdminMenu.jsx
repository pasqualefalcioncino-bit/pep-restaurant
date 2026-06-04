import { useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, apiRequest, getAuthToken } from '../../api/client';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
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
  const imageInputRef = useRef(null);

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

  const deleteMenuItem = async () => {
    if (!itemToDelete) {
      return;
    }

    setDeletingItemId(itemToDelete.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiRequest(`/menu/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      setMenuItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemToDelete.id)
      );
      setSuccessMessage(`Piatto "${itemToDelete.name}" eliminato.`);
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
        <p>{menuItems.length} piatti presenti nel database.</p>
      </div>

      {errorMessage && <p className="admin-menu-message error">Errore: {errorMessage}</p>}
      {successMessage && <p className="admin-menu-message success">{successMessage}</p>}

      <form className="admin-menu-form" onSubmit={submitMenuItem}>
        <div className="admin-menu-form-header">
          <h2>{editingItemId ? 'Modifica piatto' : 'Nuovo piatto'}</h2>
          {editingItemId && (
            <button type="button" onClick={resetForm}>
              Annulla modifica
            </button>
          )}
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
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.price}
              onChange={(event) => updateField('price', event.target.value)}
              required
            />
          </label>

          <label>
            Tempo preparazione
            <input
              type="number"
              min="0"
              value={formData.prep_time}
              onChange={(event) => updateField('prep_time', event.target.value)}
            />
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
                {isUploadingImage ? '...' : '+'}
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

        <button className="admin-menu-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : editingItemId ? 'Aggiorna piatto' : 'Crea piatto'}
        </button>
      </form>

      <div className="admin-menu-toolbar">
        <label className="admin-menu-search-field" htmlFor="admin-menu-search">
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

      {filteredMenuItems.length === 0 ? (
        <p className="admin-menu-state">Nessun piatto trovato.</p>
      ) : (
        <div className="admin-menu-table-wrap">
          <table className="admin-menu-table">
            <thead>
              <tr>
                <th>Piatto</th>
                <th>Categoria</th>
                <th>Prezzo</th>
                <th>Tempo</th>
                <th>Img</th>
                <th>Veg</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenuItems.map((item) => {
                const menuImage = getMenuImage(item.image);

                return (
                  <tr key={item.id}>
                    <td>
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
                    <td>{item.category}</td>
                    <td>{formatEuroPrice(item.price)}</td>
                    <td>{item.prep_time || 0} min</td>
                    <td>{item.image || '-'}</td>
                    <td>{item.veg ? 'Si' : 'No'}</td>
                    <td>
                      <div className="admin-menu-actions">
                        <button type="button" onClick={() => startEdit(item)}>
                          Modifica
                        </button>
                        <button
                          className="danger"
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          disabled={deletingItemId === item.id}
                        >
                          {deletingItemId === item.id ? 'Elimino...' : 'Elimina'}
                        </button>
                      </div>
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
          title="Vuoi eliminare definitivamente questo piatto?"
          summaryItems={[
            itemToDelete.name,
            itemToDelete.category,
            formatEuroPrice(itemToDelete.price),
          ]}
          isDeleting={deletingItemId === itemToDelete.id}
          onCancel={() => setItemToDelete(null)}
          onConfirm={deleteMenuItem}
        />
      )}
    </section>
  );
};

export default AdminMenu;
