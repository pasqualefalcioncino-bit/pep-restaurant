import { useEffect, useState } from 'react';
import { Camera, Mail, Phone, Save, Trash2, User } from 'lucide-react';
import { apiRequest, getAuthUser, saveAuthSession, getAuthToken } from '../api/client';
import useAutoDismiss from '../hooks/useAutoDismiss';
import { getRoleAvatar } from '../utils/roleAvatars';
import './Profile.css';

const Profile = ({ onProfileUpdate }) => {
  const storedUser = getAuthUser();
  const [profileData, setProfileData] = useState({
    name: storedUser?.name || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    avatar_url: storedUser?.avatar_url || '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useAutoDismiss(message, setMessage);
  useAutoDismiss(errorMessage, setErrorMessage);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await apiRequest('/users/me');
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar_url: user.avatar_url || '',
        });
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateField = (field, value) => {
    setProfileData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setMessage('');
    setErrorMessage('');
  };

  const updateAvatar = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Carica un file immagine valido');
      return;
    }

    if (file.size > 900 * 1024) {
      setErrorMessage("Scegli un'immagine sotto 900 KB");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateField('avatar_url', reader.result);
    };

    reader.readAsDataURL(file);
  };

  const updatePhone = (value) => {
    updateField('phone', value.replace(/\D/g, '').slice(0, 10));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setErrorMessage('');

    try {
      const updatedUser = await apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      const token = getAuthToken();

      if (token) {
        saveAuthSession({ token, user: updatedUser });
      }

      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }

      setMessage('Profilo aggiornato correttamente.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSource = profileData.avatar_url || getRoleAvatar(storedUser?.role);
  const displayInitial = profileData.name.trim().charAt(0).toUpperCase() || 'P';

  if (isLoading) {
    return (
      <section className="profile-page">
        <div className="profile-state">
          <p>Caricamento profilo...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <div className="profile-header">
        <h1 id="profile-title">Profilo</h1>
        <p>Gestisci dati, contatti e immagine del tuo account.</p>
      </div>

      <form className="profile-card" onSubmit={saveProfile}>
        <div className="profile-avatar-panel">
          {avatarSource ? (
            <img className="profile-avatar" src={avatarSource} alt="Avatar profilo" />
          ) : (
            <div className="profile-avatar placeholder" aria-hidden="true">
              {displayInitial}
            </div>
          )}
          <label className="profile-upload-btn" htmlFor="profile-avatar-upload">
            <Camera size={17} strokeWidth={2} aria-hidden="true" />
            Carica immagine
          </label>
          <input
            id="profile-avatar-upload"
            className="profile-file-input"
            type="file"
            accept="image/*"
            onChange={(event) => updateAvatar(event.target.files?.[0])}
          />
          {profileData.avatar_url && (
            <button
              className="profile-remove-avatar"
              type="button"
              onClick={() => updateField('avatar_url', '')}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
              Rimuovi immagine
            </button>
          )}
        </div>

        <div className="profile-fields">
          <div className="profile-form-group">
            <label htmlFor="profile-name">Nome e cognome</label>
            <div className="profile-input-wrap">
              <User size={18} strokeWidth={2} aria-hidden="true" />
              <input
                id="profile-name"
                type="text"
                value={profileData.name}
                onChange={(event) => updateField('name', event.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="profile-email">Email</label>
            <div className="profile-input-wrap">
              <Mail size={18} strokeWidth={2} aria-hidden="true" />
              <input
                id="profile-email"
                type="email"
                value={profileData.email}
                onChange={(event) => updateField('email', event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="profile-phone">Telefono</label>
            <div className="profile-input-wrap">
              <Phone size={18} strokeWidth={2} aria-hidden="true" />
              <input
                id="profile-phone"
                type="tel"
                value={profileData.phone}
                onChange={(event) => updatePhone(event.target.value)}
                placeholder="3331234567"
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength="10"
              />
            </div>
          </div>

          {message && <p className="profile-message success">{message}</p>}
          {errorMessage && <p className="profile-message error">{errorMessage}</p>}

          <button className="profile-save-btn" type="submit" disabled={isSaving}>
            <Save size={17} strokeWidth={2} aria-hidden="true" />
            {isSaving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Profile;
