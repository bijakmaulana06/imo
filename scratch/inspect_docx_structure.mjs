import PizZip from "pizzip";

async function inspectDocx() {
  const res = await fetch("https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785242075928_c8amy.docx");
  const ab = await res.arrayBuffer();
  const zip = new PizZip(Buffer.from(ab));

  console.log("Files in zip:");
  Object.keys(zip.files).forEach((f) => {
    if (f.startsWith("word/media/") || f.endsWith(".xml")) {
      console.log("-", f, "size:", zip.files[f].asNodeBuffer().length);
    }
  });

  if (zip.files["word/document.xml"]) {
    const text = zip.files["word/document.xml"].asText();
    console.log("\nDocument text excerpt:\n", text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 1000));
  }

  if (zip.files["word/header1.xml"]) {
    const headerText = zip.files["word/header1.xml"].asText();
    console.log("\nHeader1 text:\n", headerText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 500));
  }
}

inspectDocx().catch(console.error);
