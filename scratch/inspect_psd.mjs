import { createClient } from '@supabase/supabase-js';
import { readPsd } from 'ag-psd';

const supabaseUrl = 'https://pcalfbxvlbmqbhhazbax.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWxmYnh2bGJtcWJoaGF6YmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDE2MCwiZXhwIjoyMTAwMjE2MTYwfQ.YYaP6mUn077wtmaEH0WG-NujMT8GuyRnUiItQF-DnTo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectPsd() {
  const { data, error } = await supabase.from('id_card_templates').select('*');
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  console.log(`Found ${data.length} templates in id_card_templates table.`);

  for (const t of data) {
    console.log(`\n========================================`);
    console.log(`Template ID: ${t.id}`);
    console.log(`Name: ${t.name}`);
    console.log(`Default: ${t.is_default}, Active: ${t.is_active}`);
    console.log(`Background URL: ${t.background_url}`);
    console.log(`Layout JSON:`, JSON.stringify(t.layout_json, null, 2));

    const storagePath = t.layout_json?.storage_path;
    if (storagePath) {
      console.log(`Storage Path: ${storagePath}`);
    }
  }
}

inspectPsd().catch(console.error);
