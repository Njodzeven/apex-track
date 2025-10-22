import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// register service worker for PWA support
if ('serviceWorker' in navigator) {
  // Use Vite base so registration works when app is hosted under a subpath
  const swUrl = (import.meta.env.BASE_URL || '/') + 'sw.js';
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Service worker registration failed:', err);
    });
  });
}