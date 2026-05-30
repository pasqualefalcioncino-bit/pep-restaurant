import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import './AdminMenu.css';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'Primi',
  prep_time: '',
  image: '',
  veg: false,
};

const categories = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Vini'];

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);

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

    if (!normalizedSearch) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        (item.description || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [menuItems, searchTerm]);

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
      category: item.category || 'Primi',
      prep_time: item.prep_time || '',
      image: item.image || '',
      veg: Boolean(item.veg),
    });
    setErrorMessage('');
    setSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <span className="admin-menu-kicker">ADMIN</span>
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
            >
              {categories.map((category) => (
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
            Nome file immagine
            <input
              type="text"
              value={formData.image}
              onChange={(event) => updateField('image', event.target.value)}
              placeholder="risotto-allo-zafferano.webp"
            />
          </label>

          <label className="admin-menu-check">
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

      <AdminSearchToolbar
        id="admin-menu-search"
        placeholder="Nome, categoria o descrizione"
        value={searchTerm}
        onChange={setSearchTerm}
        resultsCount={filteredMenuItems.length}
      />

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
              {filteredMenuItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.description || '-'}</small>
                  </td>
                  <td>{item.category}</td>
                  <td>EUR {Number(item.price).toFixed(2)}</td>
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
              ))}
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
            `EUR ${Number(itemToDelete.price).toFixed(2)}`,
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
