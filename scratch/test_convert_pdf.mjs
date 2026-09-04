import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

async function test() {
  console.log("Fetching template docx...");
  const res = await fetch("https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785242075928_c8amy.docx");
  const ab = await res.arrayBuffer();
  const zip = new PizZip(Buffer.from(ab));

  // Clean XML
  Object.keys(zip.files).forEach((fileName) => {
    if (fileName.startsWith("word/") && fileName.endsWith(".xml")) {
      let cleanedXml = zip.files[fileName].asText()
        .replace(/<w:proofErr[^>]*\/>/g, "")
        .replace(/<w:proofWarning[^>]*\/>/g, "")
        .replace(/<w:noProof[^>]*\/>/g, "")
        .replace(/<w:lang[^>]*\/>/g, "");
      cleanedXml = cleanedXml.replace(/\{([a-zA-Z0-9_\-\s]+)\)[,\s]*/g, "{$1} ");
      zip.file(fileName, cleanedXml);
    }
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.render({
    name: "Xaviera Putri",
    nim: "2601234567",
    class: "TI-2026-A",
    prodi: "Teknologi Pendidikan",
    faculty: "Ilmu Pendidikan",
    phone: "08123456789",
    address: "Jl. Kampus Unesa Lidah Wetan No. 1",
    option: "dengan sungguh-sungguh",
    date: "2 September 2026",
    prname: "Drs. Budi Santoso, M.Pd",
    prwork: "PNS",
    prphone: "08198765432",
    pradd: "Jl. Lidah Wetan No. 10",
  });

  const docxBuf = doc.getZip().generate({ type: "nodebuffer" });

  console.log("Sending to Gotenberg for conversion...");
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const postDataHead = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files"; filename="document.docx"\r\n` +
    `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`
  );
  const postDataTail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const fullPayload = Buffer.concat([postDataHead, docxBuf, postDataTail]);

  const convRes = await fetch("https://demo.gotenberg.dev/forms/libreoffice/convert", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: fullPayload,
  });

  if (!convRes.ok) {
    throw new Error(`Gotenberg error: ${convRes.status} ${await convRes.text()}`);
  }

  const pdfBuf = Buffer.from(await convRes.arrayBuffer());
  fs.writeFileSync("scratch/test_real_output.pdf", pdfBuf);
  console.log("SUCCESS! Generated test_real_output.pdf with size:", pdfBuf.length);
}

test().catch(console.error);
