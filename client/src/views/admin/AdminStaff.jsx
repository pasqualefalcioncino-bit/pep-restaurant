import { useEffect, useState } from 'react';
import { apiRequest, getAuthUser } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { getRoleAvatar } from '../../utils/roleAvatars';
import './AdminStaff.css';

const AdminStaff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cuoco',
  });
  const currentUser = getAuthUser();

  useEffect(() => {
    const loadStaffMembers = async () => {
      try {
        const data = await apiRequest('/users/staff');
        setStaffMembers(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffMembers();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStaffMembers = staffMembers.filter((member) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      member.name.toLowerCase().includes(normalizedSearch) ||
      member.email.toLowerCase().includes(normalizedSearch) ||
      member.role.toLowerCase().includes(normalizedSearch)
    );
  });

  const selectableFilteredStaffMembers = filteredStaffMembers.filter((member) => {
    return currentUser?.id !== member.id;
  });
  const selectedStaffMembers = staffMembers.filter((member) => selectedStaffIds.includes(member.id));
  const areAllFilteredStaffMembersSelected =
    selectableFilteredStaffMembers.length > 0 &&
    selectableFilteredStaffMembers.every((member) => selectedStaffIds.includes(member.id));

  const updateNewStaffField = (field, value) => {
    setNewStaffForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const createStaffMember = async (event) => {
    event.preventDefault();
    setIsCreatingStaff(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const createdStaffMember = await apiRequest('/auth/employees', {
        method: 'POST',
        body: JSON.stringify(newStaffForm),
      });

      setStaffMembers((currentMembers) =>
        [...currentMembers, createdStaffMember].sort((firstMember, secondMember) =>
          firstMember.role.localeCompare(secondMember.role, 'it') ||
          firstMember.name.localeCompare(secondMember.name, 'it')
        )
      );
      setNewStaffForm({
        name: '',
        email: '',
        password: '',
        role: 'cuoco',
      });
      setIsCreateFormOpen(false);
      setSuccessMessage(`Utenza ${createdStaffMember.role} creata per ${createdStaffMember.name}.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const toggleStaffSelection = (staffId) => {
    setSelectedStaffIds((currentIds) =>
      currentIds.includes(staffId)
        ? currentIds.filter((id) => id !== staffId)
        : [...currentIds, staffId]
    );
  };

  const toggleAllFilteredStaffMembers = () => {
    setSelectedStaffIds((currentIds) => {
      if (areAllFilteredStaffMembersSelected) {
        return currentIds.filter(
          (id) => !selectableFilteredStaffMembers.some((member) => member.id === id)
        );
      }

      return [...new Set([...currentIds, ...selectableFilteredStaffMembers.map((member) => member.id)])];
    });
  };

  const deleteSelectedStaffMembers = async () => {
    if (selectedStaffMembers.length === 0) {
      return;
    }

    setDeletingStaffId(selectedStaffMembers[0].id);
    setErrorMessage('');

    try {
      await Promise.all(
        selectedStaffMembers.map((member) =>
          apiRequest(`/users/${member.id}`, {
            method: 'DELETE',
          })
        )
      );

      setStaffMembers((currentStaffMembers) =>
        currentStaffMembers.filter((member) => !selectedStaffIds.includes(member.id))
      );
      setSelectedStaffIds([]);
      setStaffToDelete(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingStaffId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-staff-page">
        <p className="admin-staff-state">Caricamento staff...</p>
      </section>
    );
  }

  return (
    <section className="admin-staff-page" aria-labelledby="admin-staff-title">
      <div className="admin-staff-header">
        <div>
          <h1 id="admin-staff-title">Staff</h1>
          <p>{staffMembers.length} membri staff presenti nel database.</p>
        </div>
        <button type="button" onClick={() => setIsCreateFormOpen((isOpen) => !isOpen)}>
          {isCreateFormOpen ? 'Chiudi creazione' : 'Crea utenza'}
        </button>
      </div>

      {errorMessage && <p className="admin-staff-state error">Errore: {errorMessage}</p>}
      {successMessage && <p className="admin-staff-state success">{successMessage}</p>}

      {isCreateFormOpen && (
        <form className="admin-staff-create-form" onSubmit={createStaffMember}>
          <label>
            <span>Nome completo</span>
            <input
              type="text"
              value={newStaffForm.name}
              onChange={(event) => updateNewStaffField('name', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={newStaffForm.email}
              onChange={(event) => updateNewStaffField('email', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password temporanea</span>
            <input
              type="password"
              value={newStaffForm.password}
              onChange={(event) => updateNewStaffField('password', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Ruolo</span>
            <select
              value={newStaffForm.role}
              onChange={(event) => updateNewStaffField('role', event.target.value)}
            >
              <option value="cuoco">Cuoco</option>
              <option value="cameriere">Cameriere</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit" disabled={isCreatingStaff}>
            {isCreatingStaff ? 'Creazione...' : 'Crea utenza'}
          </button>
        </form>
      )}

      {staffMembers.length === 0 ? (
        <p className="admin-staff-state">Nessun membro staff salvato.</p>
      ) : (
        <>
          <AdminSearchToolbar
            id="admin-staff-search"
            placeholder="Nome, email o ruolo"
            value={searchTerm}
            onChange={setSearchTerm}
            resultsCount={filteredStaffMembers.length}
          />

          <div className="admin-staff-actions">
            <span>{selectedStaffIds.length} selezionati</span>
            <button
              type="button"
              onClick={() => setStaffToDelete({ bulk: true })}
              disabled={selectedStaffIds.length === 0}
            >
              Elimina selezionati
            </button>
          </div>

          {filteredStaffMembers.length === 0 ? (
            <p className="admin-staff-state">Nessun membro staff trovato.</p>
          ) : (
            <div className="admin-staff-table-wrap">
              <table className="admin-staff-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={areAllFilteredStaffMembersSelected}
                        onChange={toggleAllFilteredStaffMembers}
                        aria-label="Seleziona tutto lo staff filtrato"
                      />
                    </th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaffMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(member.id)}
                          onChange={() => toggleStaffSelection(member.id)}
                          disabled={currentUser?.id === member.id}
                          aria-label={`Seleziona ${member.name}`}
                        />
                      </td>
                      <td>
                        <div className="admin-staff-person">
                          {getRoleAvatar(member.role) && (
                            <img src={getRoleAvatar(member.role)} alt={`Avatar ${member.role}`} />
                          )}
                          <strong>{member.name}</strong>
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>
                        <span className="admin-staff-role">{member.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {staffToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente lo staff selezionato?"
          summaryItems={selectedStaffMembers.map(
            (member) => `${member.name} - ${member.email} - ${member.role}`
          )}
          isDeleting={deletingStaffId !== null}
          onCancel={() => setStaffToDelete(null)}
          onConfirm={deleteSelectedStaffMembers}
        />
      )}
    </section>
  );
};

export default AdminStaff;