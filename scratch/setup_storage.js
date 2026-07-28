const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pcalfbxvlbmqbhhazbax.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWxmYnh2bGJtcWJoaGF6YmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDE2MCwiZXhwIjoyMTAwMjE2MTYwfQ.YYaP6mUn077wtmaEH0WG-NujMT8GuyRnUiItQF-DnTo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupStorage() {
  try {
    console.log("Checking Supabase Storage buckets...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn("List buckets note:", listError.message);
    } else {
      console.log("Existing buckets:", buckets.map(b => `${b.name} (public: ${b.public})`));
    }

    // 1. Buat / Update bucket 'templates' agar Public
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('templates', {
      public: true,
      fileSizeLimit: 20971520, // 20MB
    });

    if (createError) {
      console.log("Bucket note:", createError.message);
      // Update bucket 'templates' ke Public jika sudah ada
      const { data: updated, error: updateError } = await supabase.storage.updateBucket('templates', {
        public: true,
      });
      if (updateError) {
        console.warn("Update bucket note:", updateError.message);
      } else {
        console.log("SUCCESS: Updated bucket 'templates' to PUBLIC!");
      }
    } else {
      console.log("SUCCESS: Created PUBLIC Storage bucket 'templates'!", newBucket);
    }
  } catch (err) {
    console.error("Setup storage error:", err);
  }
}

setupStorage();
