const fs = require('fs');
const zlib = require('zlib');

const pdfPath = 'C:\\Users\\Sahil Kalathiya\\.gemini\\antigravity-ide\\brain\\6ea3d352-6314-4d86-add8-fa8f44f98282\\.user_uploaded\\media_1792404302683.pdf';
const buf = fs.readFileSync(pdfPath);

let pos = 0;
let chunks = [];

while (pos < buf.length) {
  const streamStart = buf.indexOf('stream', pos);
  if (streamStart === -1) break;
  
  let start = streamStart + 6;
  while (start < buf.length && (buf[start] === 0x0d || buf[start] === 0x0a)) start++;

  const streamEnd = buf.indexOf('endstream', start);
  if (streamEnd === -1) break;

  const streamData = buf.slice(start, streamEnd);
  let decomp = null;
  try {
    decomp = zlib.inflateSync(streamData);
  } catch (e1) {
    try {
      decomp = zlib.inflateRawSync(streamData);
    } catch (e2) {}
  }

  if (decomp) {
    const s = decomp.toString('latin1');
    chunks.push(s);
  }

  pos = streamEnd + 9;
}

const all = chunks.join('\n');
console.log('Total decompressed length:', all.length);

// Search for Elastic, Beads, Sequins, Dori
const lines = all.split('\n');
const found = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (/elastic|bead|sequin/i.test(l)) {
    found.push(`Line ${i}: ${l}`);
  }
}
console.log('Found matches:', found.length);
console.log(found.slice(0, 50).join('\n'));
fs.writeFileSync('scratch/pdf_raw_streams.txt', all, 'utf8');
