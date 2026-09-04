const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const mammoth = require('mammoth');

async function test() {
  const res = await fetch('https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785242075928_c8amy.docx');
  const ab = await res.arrayBuffer();
  const zip = new PizZip(Buffer.from(ab));
  
  // Clean docx xml
  Object.keys(zip.files).forEach((fileName) => {
    if (fileName.startsWith("word/") && fileName.endsWith(".xml")) {
      const rawXml = zip.files[fileName].asText();
      let cleanedXml = rawXml
        .replace(/<w:proofErr[^>]*\/>/g, "")
        .replace(/<w:proofWarning[^>]*\/>/g, "")
        .replace(/<w:noProof[^>]*\/>/g, "")
        .replace(/<w:lang[^>]*\/>/g, "");
      zip.file(fileName, cleanedXml);
    }
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: (part) => `[[EMPTY:${part.value}]]`
  });

  const fields = ['name', 'nim', 'class', 'prodi', 'faculty', 'phone', 'address', 'option', 'date', 'prname', 'prwork', 'prphone', 'pradd'];
  const formData = {
    name: 'Ahmad Fauzi',
    nim: '2601234567',
    class: 'TI-26-A',
    prodi: 'Teknik Informatika',
    // other fields omitted
  };

  const templateData = {};
  fields.forEach(tag => {
    const val = formData[tag];
    if (val && String(val).trim()) {
      templateData[tag] = `[[FILLED:${val}]]`;
    } else {
      templateData[tag] = `[[EMPTY:${tag}]]`;
    }
  });

  doc.render(templateData);
  const buf = doc.getZip().generate({ type: 'nodebuffer' });
  let { value: html } = await mammoth.convertToHtml({ buffer: buf });

  html = html.replace(/\[\[FILLED:(.*?)\]\]/g, '<span class="doc-filled">$1</span>');
  html = html.replace(/\[\[EMPTY:(.*?)\]\]/g, '<span class="doc-empty">[ Belum diisi: $1 ]</span>');

  console.log("RENDERED PREVIEW HTML:\n", html.substring(0, 1200));
}

test().catch(console.error);
