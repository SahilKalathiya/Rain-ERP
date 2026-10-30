const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

try {
  console.log('Testing GRNDetailView compilation...');
  esbuild.buildSync({
    entryPoints: ['frontend/src/components/Procurement/GRNDetailView.jsx'],
    bundle: false,
    write: false,
    loader: { '.jsx': 'jsx', '.js': 'jsx' }
  });
  console.log('GRNDetailView compiled cleanly.');
} catch (e) {
  console.error('GRNDetailView Compile Error:', e.message);
}

try {
  console.log('Testing Full App compilation...');
  esbuild.buildSync({
    entryPoints: ['frontend/src/main.jsx'],
    bundle: true,
    write: false,
    loader: { '.jsx': 'jsx', '.js': 'jsx' },
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  console.log('Full App compiled cleanly.');
} catch (e) {
  console.error('Full App Compile Error:', e.message);
}

