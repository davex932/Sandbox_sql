// frontend/src/App.jsx

import React from 'react';
import SqlPlayground from './SqlPlayground';

function App() {
  // En production, tu pourras récupérer le nom de la pièce et le nom d'utilisateur 
  // dynamiquement (par exemple depuis les paramètres de l'URL du navigateur)
  const roomName = "salon_ict_202";
  const username = "David_Dev";

  return (
    <SqlPlayground roomName={roomName} username={username} />
  );
}

export default App;