import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#101210',
            color: '#f5f5f5',
            border: '1px solid #1c2820',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            padding: '0.75rem 1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: {
              primary: '#2fd697',
              secondary: '#050806',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#050806',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

// Register Progressive Web App Service Worker
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('MyCloud PWA ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('MyCloud PWA ServiceWorker registration error:', err);
      });
  });
}


