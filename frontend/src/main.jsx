import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme-override.css';
import { resetExampleDataToDefaults } from './utils/dataReset';

// Automatically purge example/test records and restore default seed data
resetExampleDataToDefaults();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
