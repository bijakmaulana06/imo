const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pcalfbxvlbmqbhhazbax.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWxmYnh2bGJtcWJoaGF6YmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDE2MCwiZXhwIjoyMTAwMjE2MTYwfQ.YYaP6mUn077wtmaEH0WG-NujMT8GuyRnUiItQF-DnTo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAllTemplates() {
  const { data, error } = await supabase.from('document_templates').select('id, title, file_url, is_active');
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  console.log("=== All templates in DB ===");
  data.forEach((t, i) => {
    console.log(`[${i+1}] ID: ${t.id}`);
    console.log(`     Title: "${t.title}"`);
    console.log(`     Active: ${t.is_active}`);
    console.log(`     file_url: ${t.file_url}`);
    console.log("");
  });
}

checkAllTemplates();
