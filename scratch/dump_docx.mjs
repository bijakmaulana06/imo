import fs from "fs";
import PizZip from "pizzip";

async function dumpMedia() {
  const res = await fetch("https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785242075928_c8amy.docx");
  const ab = await res.arrayBuffer();
  const zip = new PizZip(Buffer.from(ab));

  for (const f of Object.keys(zip.files)) {
    if (f.startsWith("word/media/")) {
      const buf = zip.files[f].asNodeBuffer();
      console.log("Media file:", f, "size:", buf.length);
    }
  }

  // Header XML content
  if (zip.files["word/header1.xml"]) {
    fs.writeFileSync("scratch/header1.xml", zip.files["word/header1.xml"].asText());
    console.log("Wrote header1.xml");
  }

  if (zip.files["word/document.xml"]) {
    fs.writeFileSync("scratch/document.xml", zip.files["word/document.xml"].asText());
    console.log("Wrote document.xml");
  }
}

dumpMedia().catch(console.error);
