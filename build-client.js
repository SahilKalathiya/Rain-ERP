const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

try {
  esbuild.buildSync({
    entryPoints: ['./frontend/src/main.jsx'],
    bundle: true,
    outfile: path.join(__dirname, 'Rain ERP', 'preclinic.dreamstechnologies.com', 'react', 'assets', 'index-DX-E0Odo.js'),
    loader: { '.jsx': 'jsx', '.js': 'jsx' },
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  console.log('SUCCESSFULLY_REBUILT_MAIN_BUNDLE');

  const dashPath = path.join(__dirname, 'Rain ERP', 'preclinic.dreamstechnologies.com', 'react', 'dashboard.html');
  if (fs.existsSync(dashPath)) {
    let c = fs.readFileSync(dashPath, 'utf8');
    const t = Date.now();
    c = c.replace(/index-DX-E0Odo\.js\?v=\d+/, 'index-DX-E0Odo.js?v=' + t);
    c = c.replace(/index-DX-E0Odo\.css\?v=\d+/, 'index-DX-E0Odo.css?v=' + t);
    fs.writeFileSync(dashPath, c);
    console.log('[CacheBuster] Updated dashboard.html version to', t);
  }
} catch (err) {
  console.error('BUILD_ERROR:', err);
  process.exit(1);
}
