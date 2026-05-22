const API_URL = 'http://localhost:3000';
const AUTH_TOKEN_KEY = 'pep_auth_token';
const AUTH_USER_KEY = 'pep_auth_user';

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getAuthUser = () => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  return storedUser ? JSON.parse(storedUser) : null;
};

export const saveAuthSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const apiRequest = async (path, options = {}) => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || 'Errore nella richiesta al server');
  }

  return response.json();
};
