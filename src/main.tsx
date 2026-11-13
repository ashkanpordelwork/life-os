import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/typography.css';
import './styles/base.css';
import './components/glass.css';
import { App } from './App';
import { registerServiceWorker } from './state/push';

// Service worker: needed for push reminders (and lets the app open from the Home Screen).
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
