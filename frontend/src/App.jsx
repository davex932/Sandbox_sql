import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SqlPlayground from './components/SqlPlayground';
import { Sun, Moon, Loader2 } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Theme state: default to system preference or dark
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('devsandbox_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devsandbox_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentSession(null);
  };

  // Écran de chargement pendant la vérification du Token
  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <Loader2 size={44} color="var(--primary-accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>
          Vérification de la session en cours...
        </p>
      </div>
    );
  }

  // 1. NON CONNECTÉ -> Écran d'Authentification
  if (!user) {
    return (
      <Auth 
        onAuthSuccess={(userData) => setUser(userData)} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
    );
  }

  // 2. CONNECTÉ SANS SALON SELECTIONNÉ -> Dashboard
  if (!currentSession) {
    return (
      <Dashboard
        user={user}
        onSelectSession={(session) => setCurrentSession(session)}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // 3. DANS UN SALON ACTIF -> SqlPlayground IDE
  return (
    <SqlPlayground
      roomName={currentSession.id}
      sessionName={currentSession.name}
      username={user.username}
      initialCode={currentSession.last_code}
      onBackToDashboard={() => setCurrentSession(null)}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

const styles = {
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-main)',
  }
};