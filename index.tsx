import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';
import { registerSW } from 'virtual:pwa-register';

// P0.22 — register the service worker. Auto-updates when a new version is deployed.
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a soft "new version available" toast
    if (typeof console !== 'undefined') console.info('[PWA] New version available. Refresh to update.');
  },
  onOfflineReady() {
    if (typeof console !== 'undefined') console.info('[PWA] Ready to work offline.');
  },
});
void updateSW;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);