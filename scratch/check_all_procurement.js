const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const dir = 'frontend/src/components/Procurement';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  try {
    esbuild.buildSync({
      entryPoints: [filePath],
      bundle: false,
      write: false,
      loader: { '.jsx': 'jsx', '.js': 'jsx' }
    });
    console.log(`OK: ${f}`);
  } catch (err) {
    console.error(`ERROR in ${f}:`, err.message);
  }
});

