import React, { useState } from 'react';
import { api } from '../services/api';
import { Terminal, Lock, User, Mail, LogIn, Sun, Moon, Sparkles, ArrowRight } from 'lucide-react';

export default function Auth({ onAuthSuccess, theme, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await api.login(username, password);
        const user = await api.getCurrentUser();
        onAuthSuccess(user);
      } else {
        await api.register(username, email, password);
        await api.login(username, password);
        const user = await api.getCurrentUser();
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(err.message || "Une erreur de connexion est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navbar with Theme Toggle */}
      <nav style={styles.nav}>
        <div style={styles.brand}>
          <div style={styles.logoBadge}>
            <Terminal size={22} color="#ffffff" />
          </div>
          <span style={styles.brandTitle}>DevSandbox <span style={styles.highlight}>SQL</span></span>
        </div>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#0284c7" />}
          <span>{theme === 'dark' ? 'Thème Clair' : 'Thème Sombre'}</span>
        </button>
      </nav>

      {/* Main Glass Card */}
      <div style={styles.cardWrapper}>
        <div className="glass-card fade-in" style={styles.card}>
          <div style={styles.header}>
            <div style={styles.iconCircle}>
              <Sparkles size={28} color="var(--primary-accent)" />
            </div>
            <h2 style={styles.title}>
              {isLogin ? 'Bon retour parmi nous !' : 'Créer votre compte'}
            </h2>
            <p style={styles.subtitle}>
              {isLogin 
                ? 'Connectez-vous pour exécuter et collaborer sur vos requêtes SQL.' 
                : 'Rejoignez la plateforme et créez vos bacs à sable en temps réel.'}
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {!isLogin && (
              <div style={styles.inputGroup}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? (
                <span>Chargement...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Se connecter' : "S'inscrire"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <button 
              onClick={() => { setError(''); setIsLogin(!isLogin); }} 
              style={styles.switchBtn}
            >
              {isLogin ? "Nouveau sur DevSandbox ? Créez un compte" : 'Déjà inscrit ? Connectez-vous'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-main)',
    position: 'relative',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)',
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    color: 'var(--text-main)',
  },
  highlight: {
    color: 'var(--primary-accent)',
  },
  cardWrapper: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    borderRadius: '16px',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: '0 0 6px 0',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '8px',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0 14px',
    transition: 'border-color 0.2s ease',
  },
  inputIcon: {
    color: 'var(--text-dim)',
    marginRight: '8px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    padding: '14px 0',
    color: 'var(--text-main)',
    outline: 'none',
    fontSize: '14px',
  },
  submitBtn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--primary-accent)',
    color: '#ffffff',
    border: 'none',
    padding: '14px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
  },
  errorBox: {
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-color)',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid var(--danger-color)',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '8px',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-accent)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  }
};