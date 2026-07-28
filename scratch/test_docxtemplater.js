// Script untuk menguji docxtemplater langsung tanpa server Next.js
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const https = require('https');

// Download file docx dari URL
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

async function testDocxtemplater() {
  const url = 'https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_sample_1785165050161.docx';
  
  console.log("Downloading template from:", url);
  const fileBuffer = await downloadFile(url);
  console.log("Downloaded:", fileBuffer.length, "bytes");

  const zip = new PizZip(fileBuffer);
  
  // Show XML content
  console.log("\n=== word/document.xml content ===");
  const docXml = zip.files['word/document.xml']?.asText();
  console.log(docXml?.substring(0, 2000));

  // Clean XML
  Object.keys(zip.files).forEach((fileName) => {
    if (fileName.startsWith("word/") && fileName.endsWith(".xml")) {
      const rawXml = zip.files[fileName].asText();
      const cleanedXml = rawXml
        .replace(/<w:proofErr[^>]*\/>/g, "")
        .replace(/<w:proofWarning[^>]*\/>/g, "")
        .replace(/<w:noProof[^>]*\/>/g, "")
        .replace(/<w:lang[^>]*\/>/g, "");
      zip.file(fileName, cleanedXml);
    }
  });

  let doc;
  try {
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
  } catch (initErr) {
    console.error("Docxtemplater INIT Error:", initErr.message);
    if (initErr.properties?.errors) {
      initErr.properties.errors.forEach((e, i) => {
        console.error(`  Sub Error [${i}]:`, e.properties?.explanation || e.message);
      });
    }
    return;
  }

  const testData = { nama: "Budi Santoso", nim: "12345678", prodi: "Teknik Informatika", tanggal: "2026-07-27" };

  try {
    doc.render(testData);
    const resultBuf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    const fs = require('fs');
    fs.writeFileSync('scratch/sample_filled.docx', resultBuf);
    console.log("\nSUCCESS! Generated filled docx at scratch/sample_filled.docx");
  } catch (renderErr) {
    console.error("\nDocxtemplater RENDER Error:", renderErr.message);
    if (renderErr.properties?.errors) {
      renderErr.properties.errors.forEach((e, i) => {
        console.error(`  Sub Error [${i}]:`, e.properties?.explanation || e.properties?.id || e.message);
      });
    }
  }
}

testDocxtemplater().catch(console.error);
