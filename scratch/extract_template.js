const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'asset test', 'IMO (148 x 105 mm).html');
const content = fs.readFileSync(htmlPath, 'utf8');

const match = content.match(/<svg[\s\S]*?<\/svg>/i);
if (!match) {
  console.error("SVG not found");
  process.exit(1);
}

const svgContent = match[0];
const tsContent = `export const DEFAULT_ID_CARD_TEMPLATE = ${JSON.stringify(svgContent)};\n`;

const outputPath = path.join(__dirname, '..', 'lib', 'defaultTemplate.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log("Successfully generated lib/defaultTemplate.ts with length:", svgContent.length);
