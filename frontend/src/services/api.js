const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// 1. Helper unique pour générer les en-têtes avec le Bearer token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// 2. Fonction de rafraîchissement silencieux du token
const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_URL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      return true;
    }
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
  }

  // Nettoyage en cas d'échec
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  return false;
};

// 3. Wrapper générique pour toutes les requêtes authentifiées
const fetchWithAuth = async (url, options = {}) => {
  let headers = getAuthHeaders();
  let response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });

  // Si le token a expiré (401), on tente de le rafraîchir et de rejouer la requête
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers = getAuthHeaders();
      response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    }
  }

  return response;
};

export const api = {
  // --- AUTHENTIFICATION DJOSER ---
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/jwt/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Identifiants invalides');
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  },

  register: async (username, email, password) => {
    const res = await fetch(`${API_URL}/auth/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }
    return await res.json();
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    const res = await fetchWithAuth(`${API_URL}/auth/users/me/`);
    if (!res.ok) throw new Error('Session expirée');
    return await res.json();
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // --- SESSIONS SANDBOX ---
  getSessions: async () => {
    const res = await fetchWithAuth(`${API_URL}/api/sandbox/sessions/`);
    if (!res.ok) throw new Error('Impossible de charger les sessions');
    return await res.json();
  },

  createSession: async (name) => {
    const res = await fetchWithAuth(`${API_URL}/api/sandbox/sessions/`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Échec de création de la session');
    return await res.json();
  },

  joinSession: async (sessionId) => {
    const res = await fetchWithAuth(`${API_URL}/api/sandbox/sessions/${sessionId}/`);
    if (!res.ok) throw new Error('Session introuvable ou inaccessible');
    return await res.json();
  },

  // --- EXÉCUTION SQL ---
  executeSql: async (roomName, code) => {
    const res = await fetchWithAuth(`${API_URL}/api/sandbox/execute/`, {
      method: 'POST',
      body: JSON.stringify({
        room_name: roomName,
        code: code,
      }),
    });
    return await res.json();
  },

  // --- RECHERCHE DE SESSIONS ---
  searchSessions: async (query) => {
    if (!query || !query.trim()) {
      return api.getSessions();
    }
    const res = await fetchWithAuth(`${API_URL}/api/sandbox/search/?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur lors de la recherche');
    }
    return await res.json();
  }
};