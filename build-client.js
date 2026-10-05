const esbuild = require('esbuild');
const path = require('path');

try {
  esbuild.buildSync({
    entryPoints: ['./src/main.jsx'],
    bundle: true,
    outfile: path.join(__dirname, 'Rain ERP', 'preclinic.dreamstechnologies.com', 'react', 'assets', 'index-DX-E0Odo.js'),
    loader: { '.jsx': 'jsx', '.js': 'jsx' },
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  console.log('SUCCESSFULLY_REBUILT_MAIN_BUNDLE');
} catch (err) {
  console.error('BUILD_ERROR:', err);
  process.exit(1);
}
