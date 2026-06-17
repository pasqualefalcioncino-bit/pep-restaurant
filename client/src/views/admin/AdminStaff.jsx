import { useEffect, useMemo, useState } from 'react';
import { ChefHat, Plus, ShieldCheck, Trash2, UserCog, Users, X } from 'lucide-react';
import { apiRequest, getAuthUser } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import useAutoDismiss from '../../hooks/useAutoDismiss';
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

  useAutoDismiss(errorMessage, setErrorMessage);
  useAutoDismiss(successMessage, setSuccessMessage);

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

  const selectedStaffIdSet = useMemo(() => new Set(selectedStaffIds), [selectedStaffIds]);
  const filteredStaffMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return staffMembers.filter((member) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch) ||
        member.role.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm, staffMembers]);
  const selectableFilteredStaffMembers = useMemo(
    () => filteredStaffMembers.filter((member) => currentUser?.id !== member.id),
    [currentUser?.id, filteredStaffMembers]
  );
  const selectedStaffMembers = useMemo(
    () => staffMembers.filter((member) => selectedStaffIdSet.has(member.id)),
    [selectedStaffIdSet, staffMembers]
  );
  const staffSummary = useMemo(() => ({
    admin: staffMembers.filter((member) => member.role === 'admin').length,
    cuoco: staffMembers.filter((member) => member.role === 'cuoco').length,
    cameriere: staffMembers.filter((member) => member.role === 'cameriere').length,
  }), [staffMembers]);
  const areAllFilteredStaffMembersSelected =
    selectableFilteredStaffMembers.length > 0 &&
    selectableFilteredStaffMembers.every((member) => selectedStaffIdSet.has(member.id));

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
        currentStaffMembers.filter((member) => !selectedStaffIdSet.has(member.id))
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
        </div>
        <button type="button" onClick={() => setIsCreateFormOpen((isOpen) => !isOpen)}>
          {isCreateFormOpen ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {isCreateFormOpen ? 'Chiudi creazione' : 'Crea utenza'}
        </button>
      </div>

      <div className="admin-staff-stats" aria-label="Riepilogo staff">
        <article>
          <span>
            <Users size={17} aria-hidden="true" />
            Totali
          </span>
          <strong>{staffMembers.length}</strong>
        </article>
        <article>
          <span>
            <ShieldCheck size={17} aria-hidden="true" />
            Admin
          </span>
          <strong>{staffSummary.admin}</strong>
        </article>
        <article>
          <span>
            <ChefHat size={17} aria-hidden="true" />
            Cuochi
          </span>
          <strong>{staffSummary.cuoco}</strong>
        </article>
        <article>
          <span>
            <UserCog size={17} aria-hidden="true" />
            Sala
          </span>
          <strong>{staffSummary.cameriere}</strong>
        </article>
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
            showResults={false}
            actions={(
              <div className="admin-staff-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={toggleAllFilteredStaffMembers}
                  disabled={selectableFilteredStaffMembers.length === 0}
                >
                  {areAllFilteredStaffMembersSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
                <button
                  className="danger"
                  type="button"
                  onClick={() => setStaffToDelete({ bulk: true })}
                  disabled={selectedStaffIds.length === 0}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Elimina selezionati
                </button>
              </div>
            )}
          />

          {filteredStaffMembers.length === 0 ? (
            <p className="admin-staff-state">Nessun membro staff trovato.</p>
          ) : (
            <div className="admin-staff-table-wrap">
              <table className="admin-staff-table">
                <thead>
                  <tr>
                    <th>Sel.</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaffMembers.map((member) => {
                    const avatar = getRoleAvatar(member.role);

                    return (
                      <tr key={member.id}>
                        <td data-label="Sel.">
                          <label className="admin-staff-select-box">
                            <input
                              type="checkbox"
                              checked={selectedStaffIdSet.has(member.id)}
                              onChange={() => toggleStaffSelection(member.id)}
                              disabled={currentUser?.id === member.id}
                              aria-label={`Seleziona ${member.name}`}
                            />
                            <span aria-hidden="true" />
                          </label>
                        </td>
                        <td data-label="Nome">
                          <div className="admin-staff-person">
                            {avatar && <img src={avatar} alt={`Avatar ${member.role}`} />}
                            <strong>{member.name}</strong>
                          </div>
                        </td>
                        <td data-label="Email">{member.email}</td>
                        <td data-label="Ruolo">
                          <span className="admin-staff-role">{member.role}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {staffToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente lo staff selezionato?"
          summaryItems={selectedStaffMembers.map((member) => {
            const avatar = member.avatar_url || getRoleAvatar(member.role);

            return {
              id: member.id,
              title: member.name,
              details: [member.email, member.role],
              imageSrc: avatar,
              imageAlt: `Avatar ${member.name}`,
              fallbackText: member.name.charAt(0),
            };
          })}
          isDeleting={deletingStaffId !== null}
          onCancel={() => setStaffToDelete(null)}
          onConfirm={deleteSelectedStaffMembers}
        />
      )}
    </section>
  );
};

export default AdminStaff;
