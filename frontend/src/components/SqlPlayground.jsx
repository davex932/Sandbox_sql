import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Users, Wifi, WifiOff, CheckCircle2, AlertCircle, Table, ArrowLeft, Sun, Moon, Copy, Check } from 'lucide-react';
import { api } from '../services/api';

export default function SqlPlayground({ 
  roomName = 'default_room', 
  sessionName,
  username = 'Anonyme',
  initialCode = '-- Écris ta requête SQL ici...\nSELECT * FROM etudiants;',
  onBackToDashboard,
  theme,
  toggleTheme
}) {
  const [code, setCode] = useState(initialCode);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connexion...');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const isIncomingChange = useRef(false);
  const ws = useRef(null);
  const editorRef = useRef(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomName);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  // 1. Initialisation du WebSocket
  useEffect(() => {
    // Dérive l'URL WebSocket depuis VITE_API_URL en convertissant http->ws / https->wss
    // Cela évite d'avoir à définir une variable VITE_WS_URL séparée sur Vercel
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const baseWsUrl = apiUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');
    const wsUrl = `${baseWsUrl.replace(/\/$/, '')}/ws/sandbox/${roomName}/`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setStatusMessage('Collaboratif en direct');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'code_update') {
          isIncomingChange.current = true;
          setCode(data.code);
        }
      } catch (error) {
        console.error('Erreur WebSocket :', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setStatusMessage('Déconnecté');
    };

    return () => {
      socket.close();
    };
  }, [roomName]);

  // 2. Gestion des changements de texte
  const handleEditorChange = (value) => {
    const newCode = value || '';
    setCode(newCode);

    if (isIncomingChange.current) {
      isIncomingChange.current = false;
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: 'code_change',
          code: newCode,
          user: username,
        })
      );
    }
  };

  // 3. Exécution de la requête SQL
  const executeQuery = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const data = await api.executeSql(roomName, code);
      setQueryResult(data);
    } catch (error) {
      setQueryResult({
        success: false,
        error: "Impossible de contacter le serveur d'exécution ou session expirée.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4. Configuration des raccourcis Monaco
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeQuery();
    });

    editor.focus();
  };

  return (
    <div style={styles.container}>
      {/* Integrated IDE Topbar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBackToDashboard} style={styles.backBtn} title="Retour au tableau de bord">
            <ArrowLeft size={16} />
            <span>Tableau de bord</span>
          </button>
          
          <div style={styles.sessionTitleGroup}>
            <span style={styles.sessionTitle}>{sessionName || 'Bac à sable SQL'}</span>
            <button 
              onClick={handleCopyId} 
              style={{
                ...styles.roomBadge, 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px',
                border: '1px solid var(--border-color)',
                fontFamily: 'monospace'
              }}
              title="Cliquer pour copier l'identifiant complet du salon"
            >
              {idCopied ? <Check size={13} color="var(--success-color)" /> : <Copy size={13} />}
              <span>{idCopied ? 'ID Copié !' : `ID: ${roomName}`}</span>
            </button>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <div style={styles.statusBadge}>
            {isConnected ? (
              <span style={{ ...styles.indicator, color: 'var(--success-color)' }}>
                <Wifi size={15} style={{ marginRight: 6 }} /> {statusMessage}
              </span>
            ) : (
              <span style={{ ...styles.indicator, color: 'var(--danger-color)' }}>
                <WifiOff size={15} style={{ marginRight: 6 }} /> {statusMessage}
              </span>
            )}
          </div>

          <div style={styles.userBadge}>
            <Users size={15} style={{ marginRight: 6, color: 'var(--primary-accent)' }} />
            <span>{username}</span>
          </div>

          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#0284c7" />}
            <span>{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>
        </div>
      </header>

      {/* Main IDE Workspace */}
      <div style={styles.mainLayout}>
        {/* Editor Wrapper */}
        <div style={styles.editorWrapper} className="glass-card">
          <div style={styles.editorToolbar}>
            <span style={styles.toolbarTitle}>
              Éditeur SQL (PostgreSQL — Supabase) — <code>Ctrl + Enter</code> pour exécuter
            </span>
            
            <div style={styles.editorActions}>
              <button onClick={handleCopyCode} style={styles.toolBtn} title="Copier le code">
                {copied ? <Check size={14} color="var(--success-color)" /> : <Copy size={14} />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>

              <button 
                onClick={executeQuery} 
                disabled={isExecuting}
                style={{ 
                  ...styles.runButton, 
                  opacity: !isExecuting ? 1 : 0.6,
                  cursor: !isExecuting ? 'pointer' : 'not-allowed'
                }}
              >
                <Play size={14} fill="currentColor" />
                <span>{isExecuting ? 'Exécution...' : 'Exécuter'}</span>
              </button>
            </div>
          </div>
          
          <div style={styles.editorContainer}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                tabSize: 2,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                selectOnLineNumbers: true,
                mouseWheelZoom: true,
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>
        </div>

        {/* Results Panel */}
        <div style={styles.resultsWrapper} className="glass-card">
          <div style={styles.resultsHeader}>
            <div style={styles.resultsTitle}>
              <Table size={16} style={{ marginRight: 8, color: 'var(--primary-accent)' }} /> 
              <span>Résultats de la requête</span>
            </div>
            {queryResult && queryResult.success && queryResult.type === 'select' && (
              <span style={styles.rowCountBadge}>
                {queryResult.row_count} ligne(s)
              </span>
            )}
          </div>

          <div style={styles.resultsContent}>
            {!queryResult && (
              <div style={styles.placeholder}>
                Appuyez sur <code style={styles.codeTag}>Ctrl + Enter</code> ou cliquez sur <strong>Exécuter</strong> pour voir les résultats.
              </div>
            )}

            {queryResult && !queryResult.success && (
              <div style={styles.errorBox}>
                <AlertCircle size={20} style={{ marginRight: 10, flexShrink: 0 }} />
                <div>
                  <strong>Erreur SQL :</strong>
                  <pre style={styles.errorText}>{queryResult.error}</pre>
                </div>
              </div>
            )}

            {queryResult && queryResult.success && queryResult.type === 'mutation' && (
              <div style={styles.successBox}>
                <CheckCircle2 size={20} style={{ marginRight: 10, flexShrink: 0 }} />
                <span>{queryResult.message}</span>
              </div>
            )}

            {queryResult && queryResult.success && queryResult.type === 'select' && (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {queryResult.columns.map((col, index) => (
                        <th key={index} style={styles.th}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        style={{ backgroundColor: rowIndex % 2 === 0 ? 'var(--table-row-even)' : 'var(--table-row-odd)' }}
                        className="table-row"
                      >
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} style={styles.td}>
                            {cell === null ? <em style={{ color: 'var(--text-dim)' }}>NULL</em> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-main)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  sessionTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sessionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  roomBadge: {
    fontSize: '11px',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary-accent)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '500',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-card)',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
  },
  
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '12px',
    gap: '12px',
    overflow: 'hidden',
  },
  editorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 6,
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
  },
  editorToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-color)',
  },
  toolbarTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-muted)',
  },
  editorActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  runButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--success-color)',
    color: '#ffffff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  
  resultsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 4,
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'var(--bg-surface)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-main)',
    borderBottom: '1px solid var(--border-color)',
  },
  resultsTitle: {
    display: 'flex',
    alignItems: 'center',
  },
  rowCountBadge: {
    fontSize: '12px',
    color: 'var(--primary-accent)',
    backgroundColor: 'var(--primary-light)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  resultsContent: {
    padding: '14px',
    overflow: 'auto',
    flex: 1,
    backgroundColor: 'var(--bg-app)',
  },
  placeholder: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '24px',
  },
  codeTag: {
    backgroundColor: 'var(--bg-card)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger-color)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--danger-color)',
    fontSize: '13px',
  },
  errorText: {
    margin: '4px 0 0 0',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--success-bg)',
    color: 'var(--success-color)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--success-color)',
    fontSize: '13px',
    fontWeight: '500',
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
  },
  th: {
    backgroundColor: 'var(--table-header-bg)',
    color: 'var(--primary-accent)',
    padding: '10px 14px',
    borderBottom: '2px solid var(--border-color)',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  td: {
    padding: '9px 14px',
    borderBottom: '1px solid var(--border-color)',
    fontFamily: 'monospace',
  },
};