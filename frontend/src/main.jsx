import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme-override.css';
import { resetExampleDataToDefaults } from './utils/dataReset';

// Automatically purge example/test records and restore default seed data
resetExampleDataToDefaults();

// Requirement 45: For all number fields, keep them as simple numeric/text fields.
// Remove the scroll up/down (mouse wheel and arrow keys) increment/decrement functionality.
if (typeof window !== 'undefined') {
  // Prevent mouse wheel from incrementing/decrementing number inputs
  window.addEventListener(
    'wheel',
    (e) => {
      const el = e.target;
      if (el && el.tagName === 'INPUT' && (el.type === 'number' || el.getAttribute('type') === 'number')) {
        el.blur();
      }
      if (document.activeElement && document.activeElement.tagName === 'INPUT' && (document.activeElement.type === 'number' || document.activeElement.getAttribute('type') === 'number')) {
        document.activeElement.blur();
      }
    },
    { passive: true }
  );

  // Prevent Up/Down arrow keys on number inputs from incrementing/decrementing values
  window.addEventListener(
    'keydown',
    (e) => {
      const el = e.target;
      if (el && el.tagName === 'INPUT' && (el.type === 'number' || el.getAttribute('type') === 'number')) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }
    },
    false
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
