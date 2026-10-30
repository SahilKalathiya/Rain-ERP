const fs = require('fs');
const esbuild = require('esbuild');

// Let's bundle GRNDetailView with an empty external resolver to find any missing imports or undefined variables
const result = esbuild.buildSync({
  entryPoints: ['frontend/src/components/Procurement/GRNDetailView.jsx'],
  bundle: true,
  write: false,
  loader: { '.jsx': 'jsx', '.js': 'jsx' },
  packages: 'external'
});

console.log('Build output length:', result.outputFiles[0].text.length);

