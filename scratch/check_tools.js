const fs = require('fs');
const path = require('path');

// Let's check package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('Dependencies:', Object.keys(pkg.dependencies || {}));
console.log('DevDependencies:', Object.keys(pkg.devDependencies || {}));
console.log('Scripts:', pkg.scripts);

