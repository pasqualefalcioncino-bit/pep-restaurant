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
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
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

  const deleteStaffMember = async () => {
    if (!staffToDelete) {
      return;
    }

    setDeletingStaffId(staffToDelete.id);
    setErrorMessage('');

    try {
      await apiRequest(`/users/${staffToDelete.id}`, {
        method: 'DELETE',
      });

      setStaffMembers((currentStaffMembers) =>
        currentStaffMembers.filter((member) => member.id !== staffToDelete.id)
      );
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
        <h1 id="admin-staff-title">Staff</h1>
        <p>{staffMembers.length} membri staff presenti nel database.</p>
      </div>

      {errorMessage && <p className="admin-staff-state error">Errore: {errorMessage}</p>}

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

          {filteredStaffMembers.length === 0 ? (
            <p className="admin-staff-state">Nessun membro staff trovato.</p>
          ) : (
            <div className="admin-staff-table-wrap">
              <table className="admin-staff-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaffMembers.map((member) => (
                    <tr key={member.id}>
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
                      <td>
                        <button
                          className="admin-staff-delete-btn"
                          type="button"
                          onClick={() => setStaffToDelete(member)}
                          disabled={
                            deletingStaffId === member.id ||
                            currentUser?.id === member.id
                          }
                        >
                          {deletingStaffId === member.id ? 'Elimino...' : 'Elimina'}
                        </button>
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
          title="Vuoi eliminare definitivamente questa utenza?"
          summaryItems={[
            staffToDelete.name,
            staffToDelete.email,
            staffToDelete.role,
          ]}
          isDeleting={deletingStaffId === staffToDelete.id}
          onCancel={() => setStaffToDelete(null)}
          onConfirm={deleteStaffMember}
        />
      )}
    </section>
  );
};

export default AdminStaff;
