import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import AdminInventoryRow from '../../components/admin/AdminInventoryRow';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  filterInventoryItems,
  formatQuantity,
  getInventoryCategories,
  getInventoryStats,
  stockFilterOptions,
} from '../../utils/inventoryUtils';
import './AdminInventory.css';

const emptyForm = {
  name: '',
  category: INVENTORY_CATEGORIES[0],
  quantity: '',
  total_quantity: '',
  unit: 'kg',
  notes: '',
};

const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [activeStockFilter, setActiveStockFilter] = useState('Tutti');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadInventory = async () => {
    try {
      const data = await apiRequest('/inventory');
      setItems(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const stats = useMemo(() => getInventoryStats(items), [items]);

  const categories = useMemo(() => getInventoryCategories(items), [items]);

  const filteredItems = useMemo(() => {
    return filterInventoryItems({
      activeCategory,
      activeStockFilter,
      items,
      searchTerm,
    });
  }, [activeCategory, activeStockFilter, items, searchTerm]);

  const updateField = (field, value) => {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setErrorMessage('');
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingItemId(null);
    setErrorMessage('');
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name || '',
      category: item.category || INVENTORY_CATEGORIES[0],
      quantity: String(item.quantity ?? ''),
      total_quantity: String(item.total_quantity ?? ''),
      unit: item.unit || 'kg',
      notes: item.notes || '',
    });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
      total_quantity: Number(formData.total_quantity),
    };

    try {
      const savedItem = await apiRequest(
        editingItemId ? `/inventory/${editingItemId}` : '/inventory',
        {
          method: editingItemId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setItems((currentItems) => {
        if (editingItemId) {
          return currentItems.map((item) => (item.id === savedItem.id ? savedItem : item));
        }

        return [...currentItems, savedItem];
      });
      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!itemToDelete) {
      return;
    }

    setDeletingItemId(itemToDelete.id);
    setErrorMessage('');

    try {
      await apiRequest(`/inventory/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      setItems((currentItems) => currentItems.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);

      if (editingItemId === itemToDelete.id) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-inventory-page">
        <p className="admin-inventory-state">Caricamento inventario...</p>
      </section>
    );
  }

  return (
    <section className="admin-inventory-page" aria-labelledby="admin-inventory-title">
      <div className="admin-inventory-header">
        <div>
          <h1 id="admin-inventory-title">Inventario</h1>
          <p>Ingredienti e materie prime collegati al menu del ristorante.</p>
        </div>
      </div>

      <div className="admin-inventory-stats" aria-label="Riepilogo inventario">
        {stats.map((stat) => (
          <article className={`admin-inventory-stat tone-${stat.tone}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      {errorMessage && <p className="admin-inventory-state error">Errore: {errorMessage}</p>}

      <div className="admin-inventory-layout">
        <form className="admin-inventory-form" onSubmit={saveItem}>
          <h2>{editingItemId ? 'Modifica ingrediente' : 'Nuovo ingrediente'}</h2>

          <label>
            <span>Nome</span>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
            />
          </label>

          <label>
            <span>Categoria</span>
            <select
              value={formData.category}
              onChange={(event) => updateField('category', event.target.value)}
            >
              {INVENTORY_CATEGORIES.includes(formData.category) ? null : (
                <option value={formData.category}>{formData.category}</option>
              )}
              {INVENTORY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Quantita attuale</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(event) => updateField('quantity', event.target.value)}
              required
            />
          </label>

          <div className="admin-inventory-form-grid">
            <label>
              <span>Totale scorta</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.total_quantity}
                onChange={(event) => updateField('total_quantity', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Unita</span>
              <select value={formData.unit} onChange={(event) => updateField('unit', event.target.value)}>
                {INVENTORY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Note menu</span>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Piatti collegati o indicazioni cucina"
            />
          </label>

          <div className="admin-inventory-form-actions">
            {editingItemId && (
              <button className="admin-inventory-secondary-btn" type="button" onClick={resetForm}>
                Annulla modifica
              </button>
            )}
            <button className="admin-inventory-primary-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvataggio...' : editingItemId ? 'Salva ingrediente' : 'Crea ingrediente'}
            </button>
          </div>
        </form>

        <div className="admin-inventory-list">
          <AdminSearchToolbar
            id="admin-inventory-search"
            placeholder="Ingrediente, categoria o piatto"
            value={searchTerm}
            onChange={setSearchTerm}
            resultsCount={filteredItems.length}
            showResults={false}
          />

          <div className="admin-inventory-filters">
            <div className="admin-inventory-category-filters" aria-label="Categorie inventario">
              {categories.map((category) => (
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

            <div className="admin-inventory-status-filters" aria-label="Stato scorte">
              {stockFilterOptions.map((option) => (
                <button
                  key={option}
                  className={activeStockFilter === option ? 'active' : ''}
                  type="button"
                  onClick={() => setActiveStockFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p className="admin-inventory-state">Nessun ingrediente trovato.</p>
          ) : (
            <div className="admin-inventory-table-wrap">
              <table className="admin-inventory-table">
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Categoria</th>
                    <th>Totale</th>
                    <th>Scorta</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <AdminInventoryRow
                      deletingItemId={deletingItemId}
                      item={item}
                      key={item.id}
                      onDelete={setItemToDelete}
                      onEdit={startEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {itemToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente questo ingrediente?"
          summaryItems={[
            itemToDelete.name,
            itemToDelete.category,
            `${formatQuantity(itemToDelete.quantity)} / ${formatQuantity(itemToDelete.total_quantity)} ${
              itemToDelete.unit
            }`,
          ]}
          isDeleting={deletingItemId === itemToDelete.id}
          onCancel={() => setItemToDelete(null)}
          onConfirm={deleteItem}
        />
      )}
    </section>
  );
};

export default AdminInventory;
