import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { HrProvider } from './state/HrContext';
import { ThemeProvider } from './state/ThemeContext';
import { Layout } from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <HrProvider>
          <Layout />
        </HrProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
);
