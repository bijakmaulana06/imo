const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
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

function repairXmlTags(xml) {
  if (!xml) return xml;

  let cleaned = xml
    .replace(/<w:proofErr[^>]*\/>/g, "")
    .replace(/<w:proofWarning[^>]*\/>/g, "")
    .replace(/<w:noProof[^>]*\/>/g, "")
    .replace(/<w:lang[^>]*\/>/g, "");

  // Repair mistyped tag closing braces like {prodi), -> {prodi}
  // Replace {tag), or {tag) with {tag}
  cleaned = cleaned.replace(/\{([a-zA-Z0-9_\-\s]+)\)[,\s]*/g, "{$1} ");

  return cleaned;
}

async function testRepair() {
  const url = 'https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785164876360_txs1a.docx';
  console.log("Downloading user template...");
  const buffer = await downloadFile(url);

  const zip = new PizZip(buffer);

  Object.keys(zip.files).forEach((fileName) => {
    if (fileName.startsWith("word/") && fileName.endsWith(".xml")) {
      const rawXml = zip.files[fileName].asText();
      const repaired = repairXmlTags(rawXml);
      zip.file(fileName, repaired);
    }
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.render({
    name: "Ahmad Maulana",
    nim: "210001",
    class: "A",
    prodi: "Teknik Informatika",
    faculty: "FTI",
    phone: "08123456789",
    address: "Jakarta",
    date: "2026-07-27"
  });

  console.log("SUCCESS! User template rendered without ANY errors after auto-repair!");
}

testRepair().catch(console.error);
