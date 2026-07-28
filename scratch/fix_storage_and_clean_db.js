const { Client } = require('pg');

const connStrings = [
  "postgresql://postgres.pcalfbxvlbmqbhhazbax:BMmb6999%23%25%25@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres:BMmb6999%23%25%25@db.pcalfbxvlbmqbhhazbax.supabase.co:5432/postgres"
];

async function fixStorageAndCleanDB() {
  let connected = false;

  for (const connStr of connStrings) {
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log("SUCCESS: Connected to PostgreSQL!");
      connected = true;

      const sql = `
        -- 1. Hapus record lama yang file-nya tidak ada di storage
        DELETE FROM document_templates WHERE file_url LIKE '%doc_tpl_1785164414767%';

        -- 2. Buat Storage RLS Policies untuk bucket 'templates' di storage.objects
        DO $$
        BEGIN
          -- Policy Select (Public Read)
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public read for templates bucket'
          ) THEN
            CREATE POLICY "Allow public read for templates bucket"
            ON storage.objects FOR SELECT TO public
            USING (bucket_id = 'templates');
          END IF;

          -- Policy Insert (Public & Auth Upload)
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public insert for templates bucket'
          ) THEN
            CREATE POLICY "Allow public insert for templates bucket"
            ON storage.objects FOR INSERT TO public
            WITH CHECK (bucket_id = 'templates');
          END IF;

          -- Policy Update
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public update for templates bucket'
          ) THEN
            CREATE POLICY "Allow public update for templates bucket"
            ON storage.objects FOR UPDATE TO public
            USING (bucket_id = 'templates');
          END IF;

          -- Policy Delete
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public delete for templates bucket'
          ) THEN
            CREATE POLICY "Allow public delete for templates bucket"
            ON storage.objects FOR DELETE TO public
            USING (bucket_id = 'templates');
          END IF;
        END
        $$;
      `;

      await client.query(sql);
      console.log("CLEANUP & STORAGE RLS POLICIES COMPLETED SUCCESSFULLY!");
      await client.end();
      break;
    } catch (err) {
      console.warn("Connection attempt failed:", err.message);
      await client.end();
    }
  }

  if (!connected) {
    console.error("Connection failed.");
    process.exit(1);
  }
}

fixStorageAndCleanDB();
