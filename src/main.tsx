import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA offline capabilities and mobile phone push notification delivery
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('BMW Cinema PWA has new updates available. Refreshing cache...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('BMW Cinema PWA is cached for offline operation.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
