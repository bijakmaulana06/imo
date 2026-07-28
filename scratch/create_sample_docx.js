const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pcalfbxvlbmqbhhazbax.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWxmYnh2bGJtcWJoaGF6YmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDE2MCwiZXhwIjoyMTAwMjE2MTYwfQ.YYaP6mUn077wtmaEH0WG-NujMT8GuyRnUiItQF-DnTo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Content Types XML
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

// Root Relationship XML
const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

// Document Relationship XML
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

// Word Document XML with tags {nama}, {nim}, {prodi}, {tanggal}
const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t w:space="preserve">SURAT PERNYATAAN MAHASISWA IMO 2026</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t w:space="preserve">Nama Lengkap: {nama}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t w:space="preserve">NIM / Nomor Identitas: {nim}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t w:space="preserve">Program Studi: {prodi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t w:space="preserve">Tanggal Pengajuan: {tanggal}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

async function main() {
  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/_rels/document.xml.rels', docRelsXml);
  zip.file('word/document.xml', documentXml);

  const docxBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const fileName = `doc_tpl_sample_${Date.now()}.docx`;
  const filePath = `document-templates/${fileName}`;

  console.log("Uploading sample docx to Supabase Storage 'templates' bucket...");
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('templates')
    .upload(filePath, docxBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from('templates')
    .getPublicUrl(filePath);

  const fileUrl = publicUrlData.publicUrl;
  console.log("Uploaded file URL:", fileUrl);

  const sampleFields = [
    { id: "1", tag: "nama", label: "Nama Lengkap", type: "text", required: true },
    { id: "2", tag: "nim", label: "NIM / Nomor Identitas", type: "text", required: true },
    {
      id: "3",
      tag: "prodi",
      label: "Program Studi",
      type: "select",
      options: ["Teknik Informatika", "Sistem Informasi", "Teknik Elektro"],
      required: true,
    },
    { id: "4", tag: "tanggal", label: "Tanggal Pengajuan", type: "date", required: true },
  ];

  console.log("Inserting sample template to database...");
  const { data: inserted, error: dbError } = await supabase
    .from('document_templates')
    .insert({
      title: "Surat Pernyataan Mahasiswa IMO 2026 (Contoh)",
      description: "Contoh dokumen pengisian otomatis surat pernyataan mahasiswa.",
      file_url: fileUrl,
      file_path: filePath,
      fields_config: sampleFields,
      is_active: true,
    })
    .select('*')
    .single();

  if (dbError) {
    console.error("DB Insert error:", dbError);
  } else {
    console.log("SUCCESS! Created sample template in DB with ID:", inserted.id);
    console.log(`Direct Form URL: /documents/${inserted.id}`);
  }
}

main();
