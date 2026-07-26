import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Users, Wifi, WifiOff, CheckCircle2, AlertCircle, Table } from 'lucide-react';

export default function SqlPlayground({ roomName = 'default_room', username = 'Anonyme' }) {
  const [code, setCode] = useState('-- Écris ta requête SQL ici...\nSELECT * FROM etudiants;');
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connexion...');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  const isIncomingChange = useRef(false);
  const ws = useRef(null);
  const editorRef = useRef(null);

  // 1. Initialisation du WebSocket
  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8000/ws/sandbox/${roomName}/`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setStatusMessage('Connecté au salon collaboratif');
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

  // 3. Fonction d'exécution de la requête SQL
  const executeQuery = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/sandbox/execute/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: roomName,
          code: code,
        }),
      });

      const data = await response.json();
      setQueryResult(data);
    } catch (error) {
      setQueryResult({
        success: false,
        error: "Impossible de contacter le serveur d'exécution.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // 4. Configuration des raccourcis de l'éditeur lors du montage de Monaco
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Ajout du raccourci Ctrl+Enter (ou Cmd+Enter) pour exécuter la requête
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeQuery();
    });

    // S'assure que le focus est immédiatement capturé et la souris active
    editor.focus();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>DevSandbox</span>
          <span style={styles.badge}>Salon: {roomName}</span>
        </div>
        
        <div style={styles.status}>
          {isConnected ? (
            <span style={{ ...styles.indicator, color: '#10b981' }}>
              <Wifi size={16} style={{ marginRight: 6 }} /> {statusMessage}
            </span>
          ) : (
            <span style={{ ...styles.indicator, color: '#ef4444' }}>
              <WifiOff size={16} style={{ marginRight: 6 }} /> {statusMessage}
            </span>
          )}
          <span style={styles.userBadge}>
            <Users size={16} style={{ marginRight: 6 }} /> {username}
          </span>
        </div>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.editorWrapper}>
          <div style={styles.editorToolbar}>
            <span style={styles.toolbarTitle}>Éditeur SQL (SQLite) — <code>Ctrl + Enter</code> pour exécuter</span>
            <button 
              onClick={executeQuery} 
              disabled={!isConnected || isExecuting}
              style={{ 
                ...styles.runButton, 
                opacity: (isConnected && !isExecuting) ? 1 : 0.5,
                cursor: (isConnected && !isExecuting) ? 'pointer' : 'not-allowed'
              }}
            >
              <Play size={14} fill="currentColor" />
              {isExecuting ? 'Exécution...' : 'Exécuter'}
            </button>
          </div>
          
          <div style={styles.editorContainer}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,  // S'adapte au redimensionnement de la fenêtre
                tabSize: 2,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                selectOnLineNumbers: true, // Permet de sélectionner une ligne entière en cliquant sur son numéro
                mouseWheelZoom: true,      // Zoom avec Ctrl + Molette de la souris
                multiCursorModifier: 'alt', // Alt + Clic pour ajouter plusieurs curseurs avec la souris
                renderLineHighlight: 'all', // Surligne la ligne où se trouve le curseur
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Panneau de résultats */}
        <div style={styles.resultsWrapper}>
          <div style={styles.resultsHeader}>
            <Table size={16} style={{ marginRight: 8 }} /> Résultat de l'exécution
          </div>

          <div style={styles.resultsContent}>
            {!queryResult && (
              <div style={styles.placeholder}>
                Clique sur "Exécuter" ou utilise <code>Ctrl + Enter</code> pour voir le résultat.
              </div>
            )}

            {queryResult && !queryResult.success && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
                <div>
                  <strong>Erreur SQL :</strong>
                  <pre style={styles.errorText}>{queryResult.error}</pre>
                </div>
              </div>
            )}

            {queryResult && queryResult.success && queryResult.type === 'mutation' && (
              <div style={styles.successBox}>
                <CheckCircle2 size={18} style={{ marginRight: 8 }} />
                <span>{queryResult.message}</span>
              </div>
            )}

            {queryResult && queryResult.success && queryResult.type === 'select' && (
              <div style={styles.tableContainer}>
                <div style={styles.rowCount}>
                  {queryResult.row_count} ligne(s) retournée(s)
                </div>
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
                      <tr key={rowIndex} style={rowIndex % 2 === 0 ? styles.trEven : styles.trOdd}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} style={styles.td}>
                            {cell === null ? <em style={{ color: '#64748b' }}>NULL</em> : String(cell)}
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
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' },
  badge: { fontSize: '12px', backgroundColor: '#334155', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e1' },
  status: { display: 'flex', alignItems: 'center', gap: '20px' },
  indicator: { display: 'flex', alignItems: 'center', fontSize: '14px' },
  userBadge: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#94a3b8' },
  
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '16px',
    gap: '16px',
    overflow: 'hidden',
  },
  editorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 6,
    minHeight: '250px',
  },
  editorToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#1e293b',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    borderBottom: '1px solid #334155',
  },
  toolbarTitle: { fontSize: '13px', fontWeight: '500', color: '#94a3b8' },
  runButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
  },
  editorContainer: {
    flex: 1,
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    overflow: 'hidden',
  },
  
  resultsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 4,
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    border: '1px solid #334155',
    overflow: 'hidden',
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#0f172a',
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
    borderBottom: '1px solid #334155',
  },
  resultsContent: {
    padding: '16px',
    overflow: 'auto',
    flex: 1,
  },
  placeholder: {
    color: '#64748b',
    fontSize: '13px',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '20px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: '#450a0a',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid #991b1b',
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
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid #065f46',
    fontSize: '13px',
  },
  tableContainer: { width: '100%' },
  rowCount: { fontSize: '12px', color: '#94a3b8', marginBottom: '8px' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    padding: '8px 12px',
    borderBottom: '2px solid #334155',
    fontFamily: 'monospace',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #334155',
    fontFamily: 'monospace',
  },
  trEven: { backgroundColor: '#1e293b' },
  trOdd: { backgroundColor: '#0f172a' },
};