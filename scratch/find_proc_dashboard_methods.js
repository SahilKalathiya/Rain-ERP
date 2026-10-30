const fs = require('fs');

const content = fs.readFileSync('frontend/src/components/Procurement/ProcurementDashboard.jsx', 'utf8');

const regex = /(\w+)\.(replace|includes|startsWith)\(/g;
let m;
while ((m = regex.exec(content)) !== null) {
  const lineNum = content.slice(0, m.index).split('\n').length;
  console.log(`Line ${lineNum}: ${m[0]}`);
}

