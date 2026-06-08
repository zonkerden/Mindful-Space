import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeProvider';
import './index.css';

if (typeof window !== 'undefined') {
  // Gracefully catch and suppress WebSocket sandbox connection/close errors of the dev server
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && (
      (typeof reason === 'string' && (reason.toLowerCase().includes('websocket') || reason.toLowerCase().includes('ws://') || reason.toLowerCase().includes('wss://'))) ||
      (reason.message && (reason.message.toLowerCase().includes('websocket') || reason.message.toLowerCase().includes('ws://') || reason.message.toLowerCase().includes('wss://')))
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message;
    if (msg && (msg.toLowerCase().includes('websocket') || msg.toLowerCase().includes('ws://') || msg.toLowerCase().includes('wss://'))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);

