const fs = require('fs');

try {
  const nm = fs.readdirSync('node_modules');
  console.log('node_modules entries:', nm.filter(x => !x.startsWith('.')));
} catch (e) {
  console.error(e);
}

