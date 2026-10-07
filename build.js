const esbuild = require('esbuild');
const path = require('path');

const BASE_DIR = __dirname;
const REACT_DIR = path.join(BASE_DIR, 'Rain ERP', 'preclinic.dreamstechnologies.com', 'react');

try {
  esbuild.buildSync({
    entryPoints: [path.join(BASE_DIR, 'frontend', 'src', 'main.jsx')],
    bundle: true,
    outfile: path.join(REACT_DIR, 'assets', 'index-DX-E0Odo.js'),
    loader: { '.jsx': 'jsx', '.js': 'jsx' },
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  console.log('✅ React bundle compiled successfully!');
} catch (err) {
  console.error('❌ Build failed:', err);
  process.exit(1);
}
