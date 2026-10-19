const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  const dataBuffer = fs.readFileSync('C:\\Users\\Sahil Kalathiya\\.gemini\\antigravity-ide\\brain\\6ea3d352-6314-4d86-add8-fa8f44f98282\\.user_uploaded\\media_1792404302683.pdf');
  const parser = new PDFParse({ data: dataBuffer });
  const textResult = await parser.getText();
  fs.writeFileSync('scratch/pdf_full_text.txt', textResult.text, 'utf8');
  console.log('Total characters:', textResult.text.length);

  const lines = textResult.text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/elastic|bead|sequin|dori|button|lace|category/i.test(l)) {
      console.log(`L${i}: ${l}`);
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        console.log(`   + ${lines[i+j]}`);
      }
      i += 2;
    }
  }
}

main().catch(console.error);
