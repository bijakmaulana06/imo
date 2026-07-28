const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pcalfbxvlbmqbhhazbax.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWxmYnh2bGJtcWJoaGF6YmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDE2MCwiZXhwIjoyMTAwMjE2MTYwfQ.YYaP6mUn077wtmaEH0WG-NujMT8GuyRnUiItQF-DnTo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAll() {
  console.log("=== 1. CHECKING DOCUMENT_TEMPLATES TABLE IN DB ===");
  const { data: dbTemplates, error: dbErr } = await supabase
    .from('document_templates')
    .select('*');

  if (dbErr) {
    console.error("DB Select Error:", dbErr);
  } else {
    console.log(`Found ${dbTemplates.length} templates in DB:`);
    dbTemplates.forEach((t, i) => {
      console.log(`[${i+1}] ID: ${t.id} | Title: "${t.title}"`);
      console.log(`     file_url:  ${t.file_url}`);
      console.log(`     file_path: ${t.file_path}`);
    });
  }

  console.log("\n=== 2. CHECKING FILES IN SUPABASE STORAGE BUCKET 'templates' ===");
  const { data: filesTemplates, error: storageErr1 } = await supabase
    .storage
    .from('templates')
    .list('document-templates');

  if (storageErr1) {
    console.error("Storage list error for 'templates':", storageErr1);
  } else {
    console.log("Files in 'templates/document-templates':", filesTemplates ? filesTemplates.map(f => f.name) : []);
  }

  console.log("\n=== 3. CHECKING FILES IN SUPABASE STORAGE BUCKET 'document_templates' ===");
  const { data: filesDocTemplates, error: storageErr2 } = await supabase
    .storage
    .from('document_templates')
    .list('document-templates');

  if (storageErr2) {
    console.error("Storage list error for 'document_templates':", storageErr2);
  } else {
    console.log("Files in 'document_templates/document-templates':", filesDocTemplates ? filesDocTemplates.map(f => f.name) : []);
  }
}

checkAll();
