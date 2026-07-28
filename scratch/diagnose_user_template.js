// Script untuk mengunduh dan mendiagnosis template Word asli milik user
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

// Menyatukan <w:r> runs yang terpecah karena spellcheck Word
// Word sering memecah {nama} menjadi beberapa run terpisah: { | nama | }
function mergeRunsContainingTags(xml) {
  // Strategy: gabungkan semua teks dalam <w:r>...<w:t>...</w:t>...</w:r> 
  // yang berdekatan dan membentuk pola {tag}
  
  // Step 1: Ganti semua sequence <w:r> elements yang terpecah
  // Pattern: gabungkan semua <w:t> yang bersebelahan dalam paragraph yang sama
  let result = xml;
  
  // Regex untuk menangkap semua text dalam w:r yang berdekatan
  // dan menggabungkan text yang terpotong-potong menjadi satu run
  result = result.replace(
    /(<w:r>(?:<w:rPr>.*?<\/w:rPr>)?<w:t[^>]*>)(.*?)(<\/w:t><\/w:r>)(?:\s*<w:r>(?:<w:rPr>.*?<\/w:rPr>)?<w:t[^>]*>)(.*?)(<\/w:t><\/w:r>)/gs,
    (match, open1, text1, close1, text2, close2) => {
      const combined = text1 + text2;
      // Hanya gabungkan jika teks gabungan mengandung awalan/akhiran tag
      if (
        text1.includes('{') || text1.includes('}') || 
        text2.includes('{') || text2.includes('}') ||
        (text1 + text2).match(/\{[^}]+\}/)
      ) {
        return `${open1}${combined}${close1}`;
      }
      return match;
    }
  );
  
  return result;
}

async function diagnoseTemplate() {
  const url = 'https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785164876360_txs1a.docx';
  
  console.log("Downloading USER's template from:", url);
  const fileBuffer = await downloadFile(url);
  console.log("Downloaded:", fileBuffer.length, "bytes");

  const zip = new PizZip(fileBuffer);
  
  const docXml = zip.files['word/document.xml']?.asText() || '';
  console.log("\n=== word/document.xml (first 3000 chars) ===");
  console.log(docXml.substring(0, 3000));
  
  // Cek apakah ada tag yang terpecah
  const brokenTags = docXml.match(/<\/w:r>\s*<w:r>[^<]*<w:t[^>]*>[^{]*[{}][^<]*<\/w:t>/g);
  console.log("\n=== Potential broken tag runs detected:", brokenTags ? brokenTags.length : 0);
  if (brokenTags) {
    brokenTags.slice(0, 5).forEach((t, i) => console.log(`[${i+1}]`, t));
  }

  // Coba render langsung tanpa cleaning
  try {
    const zip2 = new PizZip(fileBuffer);
    const doc2 = new Docxtemplater(zip2, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" });
    doc2.render({ nama: "Test", nim: "123", prodi: "TI", tanggal: "2026-07-27" });
    console.log("\nSUCCESS: Rendering WITHOUT cleaning worked!");
  } catch (e) {
    console.error("\nFAILED without cleaning:", e.message);
    if (e.properties?.errors) {
      e.properties.errors.forEach((sub, i) => {
        console.error(`  [${i}] id=${sub.properties?.id} explanation=${sub.properties?.explanation}`);
      });
    }
  }
}

diagnoseTemplate().catch(console.error);
