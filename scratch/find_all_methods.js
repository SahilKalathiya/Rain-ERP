const fs = require('fs');

const lines = fs.readFileSync('frontend/src/components/Procurement/GRNDetailView.jsx', 'utf8').split('\n');

const dangerousPatterns = [
  /\.\w+\(/,
];

lines.forEach((line, i) => {
  // check for method calls on properties
  if (line.includes('.replace(') ||
      line.includes('.toLowerCase(') ||
      line.includes('.toUpperCase(') ||
      line.includes('.split(') ||
      line.includes('.includes(') ||
      line.includes('.toFixed(') ||
      line.includes('.toLocaleString(') ||
      line.includes('.trim(')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

