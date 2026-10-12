import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA offline capabilities and mobile phone push notification delivery
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('BMW Cinema PWA has new updates available.');
  },
  onOfflineReady() {
    console.log('BMW Cinema PWA is cached for offline operation.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
