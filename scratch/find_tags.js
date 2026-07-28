const PizZip = require('pizzip');
const https = require('https');

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function findTagContext() {
  const url = 'https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785164876360_txs1a.docx';
  const fileBuffer = await downloadFile(url);
  const zip = new PizZip(fileBuffer);

  // Strip all XML tags to get plain text and find tags
  const docXml = zip.files['word/document.xml']?.asText() || '';
  const plainText = docXml.replace(/<[^>]+>/g, '');

  // Find all { ... } occurrences
  const matches = [...plainText.matchAll(/\{[^}]{0,200}/g)];
  console.log(`Found ${matches.length} opening braces:\n`);
  matches.slice(0, 20).forEach((m, i) => {
    console.log(`[${i+1}] offset=${m.index}:  ${m[0].substring(0, 150)}`);
  });
}

findTagContext().catch(console.error);
