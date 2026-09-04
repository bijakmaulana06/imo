import fs from "fs";
import path from "path";
import PizZip from "pizzip";

async function extractLogos() {
  const res = await fetch("https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785242075928_c8amy.docx");
  const ab = await res.arrayBuffer();
  const zip = new PizZip(Buffer.from(ab));

  const outDir = path.join(process.cwd(), "public", "templates");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // image1.png -> unesa_logo.png
  if (zip.files["word/media/image1.png"]) {
    fs.writeFileSync(path.join(outDir, "unesa_logo.png"), zip.files["word/media/image1.png"].asNodeBuffer());
    console.log("Saved public/templates/unesa_logo.png");
  }

  // image3.png -> hmptp_logo.png
  if (zip.files["word/media/image3.png"]) {
    fs.writeFileSync(path.join(outDir, "hmptp_logo.png"), zip.files["word/media/image3.png"].asNodeBuffer());
    console.log("Saved public/templates/hmptp_logo.png");
  }
}

extractLogos().catch(console.error);
