const { Client } = require('pg');

const connStrings = [
  "postgresql://postgres.pcalfbxvlbmqbhhazbax:BMmb6999%23%25%25@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres:BMmb6999%23%25%25@db.pcalfbxvlbmqbhhazbax.supabase.co:5432/postgres"
];

async function runMigration() {
  let connected = false;
  
  for (const connStr of connStrings) {
    console.log("Attempting database connection...");
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log("SUCCESS: Connected to PostgreSQL!");
      connected = true;

      const sql = `
        -- 1. Buat tabel jika belum ada
        CREATE TABLE IF NOT EXISTS document_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            file_url TEXT,
            file_path TEXT,
            fields_config JSONB NOT NULL DEFAULT '[]'::jsonb,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 2. Pastikan kolom fields_config, file_url, dan file_path aman (DROP NOT NULL pada file_path)
        ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS fields_config JSONB NOT NULL DEFAULT '[]'::jsonb;
        ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS file_url TEXT;
        ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS file_path TEXT;

        -- Hapus NOT NULL constraint pada file_path jika ada
        ALTER TABLE document_templates ALTER COLUMN file_path DROP NOT NULL;

        -- 3. Reload PostgREST schema cache Supabase
        NOTIFY pgrst, 'reload schema';
      `;

      await client.query(sql);
      console.log("MIGRATION COMPLETED: file_path NOT NULL constraint removed & file_url column ensured!");
      await client.end();
      break;
    } catch (err) {
      console.warn("Connection attempt failed:", err.message);
      await client.end();
    }
  }

  if (!connected) {
    console.error("All PostgreSQL connection attempts failed.");
    process.exit(1);
  }
}

runMigration();
