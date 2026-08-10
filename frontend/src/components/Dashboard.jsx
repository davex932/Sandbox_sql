import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, LogOut, ExternalLink, Database, KeyRound, Clock, Sun, Moon, Search, Sparkles, Code } from 'lucide-react';

export default function Dashboard({ user, onSelectSession, onLogout, theme, toggleTheme }) {
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.searchSessions(searchQuery);
        setSessions(data);
      } catch (err) {
        setError(err.message || 'Erreur lors de la recherche des sessions');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    try {
      const session = await api.createSession(newSessionName);
      onSelectSession(session);
    } catch (err) {
      setError('Échec de la création du salon');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const session = await api.joinSession(joinCode.trim());
      onSelectSession(session);
    } catch (err) {
      setError('Impossible de rejoindre ce salon. Vérifiez l\'identifiant UUID.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Application Bar */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoBadge}>
            <Database size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={styles.title}>DevSandbox <span style={styles.highlight}>SQL</span></h1>
            <span style={styles.subtitleHeader}>Tableau de bord collaboratif</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#0284c7" />}
            <span>{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>

          <div style={styles.userBadge}>
            <span style={styles.userAvatar}>{user.username.charAt(0).toUpperCase()}</span>
            <span style={styles.username}>{user.username}</span>
          </div>

          <button onClick={onLogout} style={styles.logoutBtn} title="Déconnexion">
            <LogOut size={16} />
            <span style={styles.logoutText}>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Content Container */}
      <main style={styles.content}>
        <div style={styles.contentInner} className="fade-in">
          
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Action Grid */}
          <div style={styles.actionGrid}>
            {/* Create Session Card */}
            <form onSubmit={handleCreate} className="glass-card" style={styles.actionCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.actionIcon, backgroundColor: 'var(--success-bg)', color: 'var(--success-color)' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={styles.actionTitle}>Créer une nouvelle session</h3>
                  <p style={styles.actionSub}>Initialisez un nouvel espace de travail SQL</p>
                </div>
              </div>
              <div style={styles.cardBody}>
                <input
                  type="text"
                  placeholder="Nom de la session (ex: TP SQLite Base de Données)"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.createBtn}>
                  <Sparkles size={16} /> Créer & Ouvrir
                </button>
              </div>
            </form>

            {/* Join Session Card */}
            <form onSubmit={handleJoin} className="glass-card" style={styles.actionCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.actionIcon, backgroundColor: 'var(--primary-light)', color: 'var(--primary-accent)' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={styles.actionTitle}>Rejoindre un salon</h3>
                  <p style={styles.actionSub}>Entrez l'identifiant UUID fourni par un collaborateur</p>
                </div>
              </div>
              <div style={styles.cardBody}>
                <input
                  type="text"
                  placeholder="Coller le code du salon..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.joinBtn}>
                  Rejoindre le salon
                </button>
              </div>
            </form>
          </div>

          {/* Sessions List Header */}
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Vos espaces récents</h2>
              <p style={styles.sectionSub}>Accédez directement à vos sessions enregistrées</p>
            </div>

            <div style={styles.searchWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Sessions Grid */}
          {loading ? (
            <div style={styles.loadingBox}>Chargement de vos espaces de travail...</div>
          ) : sessions.length === 0 ? (
            <div style={styles.emptyState}>
              <Code size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <p style={styles.emptyText}>
                {searchQuery ? 'Aucune session ne correspond à votre recherche.' : 'Vous n\'avez encore aucune session enregistrée.'}
              </p>
            </div>
          ) : (
            <div style={styles.sessionGrid}>
              {sessions.map((s) => (
                <div key={s.id} className="glass-card" style={styles.sessionCard}>
                  <div style={styles.sessionCardHeader}>
                    <h4 style={styles.sessionName}>{s.name}</h4>
                    <span style={styles.sessionBadge}>SQL</span>
                  </div>
                  
                  <div style={styles.sessionMeta}>
                    <Clock size={13} />
                    <span>Modifié le {new Date(s.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={styles.sessionCodePreview}>
                    <code>{s.last_code ? s.last_code.substring(0, 75) + '...' : '-- Aucun code enregistré'}</code>
                  </div>

                  <button onClick={() => onSelectSession(s)} style={styles.openBtn}>
                    <span>Ouvrir l'éditeur</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
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
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 32px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    lineHeight: '1.2',
  },
  highlight: {
    color: 'var(--primary-accent)',
  },
  subtitleHeader: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    padding: '4px 12px 4px 6px',
    borderRadius: '20px',
  },
  userAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-accent)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  username: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-main)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-color)',
    border: '1px solid var(--danger-color)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  logoutText: {
    '@media (maxWidth: 640px)': {
      display: 'none',
    }
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 24px',
    display: 'flex',
    justifyContent: 'center',
  },
  contentInner: {
    width: '100%',
    maxWidth: '1100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    borderRadius: '14px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  actionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-main)',
    margin: 0,
  },
  actionSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: '2px 0 0 0',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: 'var(--text-main)',
    fontSize: '14px',
    outline: 'none',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'var(--success-color)',
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
  },
  joinBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'var(--primary-accent)',
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: 0,
  },
  sectionSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: '4px 0 0 0',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0 12px',
    width: '260px',
  },
  searchIcon: {
    color: 'var(--text-dim)',
    marginRight: '8px',
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px 0',
    color: 'var(--text-main)',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  },
  sessionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '18px',
  },
  sessionCard: {
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '14px',
  },
  sessionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  sessionName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--primary-accent)',
    lineHeight: '1.3',
  },
  sessionBadge: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary-accent)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  sessionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  sessionCodePreview: {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  openBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    padding: '9px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px',
    transition: 'all 0.2s ease',
  },
  errorBox: {
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-color)',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid var(--danger-color)',
  },
  loadingBox: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    border: '1px border var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  }
};