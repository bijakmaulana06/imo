const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionStrings = [
  'postgresql://postgres.pcalfbxvlbmqbhhazbax:BMmb6999%23%25%25@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.pcalfbxvlbmqbhhazbax:BMmb6999%23%25%25@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
];

async function run() {
  let connectedClient = null;

  for (const connStr of connectionStrings) {
    console.log("Trying connection string:", connStr.replace(/:[^:@]+@/, ':****@'));
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log("Successfully connected!");
      connectedClient = client;
      break;
    } catch (err) {
      console.warn("Failed connection attempt:", err.message);
      await client.end().catch(() => {});
    }
  }

  if (!connectedClient) {
    console.error("Could not connect to database with any connection string.");
    process.exit(1);
  }

  // Individual SQL statements to execute sequentially
  const statements = [
    // Function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = now();
       RETURN NEW;
    END;
    $$ language 'plpgsql';`,

    // Announcements
    `CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        pinned BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Hub Links
    `CREATE TABLE IF NOT EXISTS hub_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label TEXT NOT NULL,
        url TEXT NOT NULL,
        icon_key TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // ID Card Templates
    `CREATE TABLE IF NOT EXISTS id_card_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        background_url TEXT NOT NULL,
        layout_json JSONB NOT NULL,
        color_scheme JSONB NOT NULL DEFAULT '{}'::jsonb,
        width INT NOT NULL DEFAULT 800,
        height INT NOT NULL DEFAULT 1200,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Contact Persons
    `CREATE TABLE IF NOT EXISTS contact_persons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        group_name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        instagram TEXT,
        photo_url TEXT,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Document Templates
    `CREATE TABLE IF NOT EXISTS document_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        fields_config JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // System Settings
    `CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Task Definitions
    `CREATE TABLE IF NOT EXISTS task_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        keyword TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Deadline column on task_definitions
    `DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_definitions' AND column_name = 'deadline'
      ) THEN
        ALTER TABLE task_definitions ADD COLUMN deadline TIMESTAMP WITH TIME ZONE NULL;
      END IF;
    END $$;`,

    // Push Subscriptions table
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_name TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // RLS Enablement
    `ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE hub_links ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE id_card_templates ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE contact_persons ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE task_definitions ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;`,

    // RLS Policies
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to announcements') THEN
        CREATE POLICY "Allow public read access to announcements" ON announcements FOR SELECT TO public USING (true);
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to system_settings') THEN
        CREATE POLICY "Allow public read access to system_settings" ON system_settings FOR SELECT TO public USING (true);
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin write access to system_settings') THEN
        CREATE POLICY "Allow admin write access to system_settings" ON system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to task_definitions') THEN
        CREATE POLICY "Allow public read access to task_definitions" ON task_definitions FOR SELECT TO public USING (is_active = true);
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin write access to task_definitions') THEN
        CREATE POLICY "Allow admin write access to task_definitions" ON task_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert access to push_subscriptions') THEN
        CREATE POLICY "Allow public insert access to push_subscriptions" ON push_subscriptions FOR INSERT TO public WITH CHECK (true);
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select access to push_subscriptions') THEN
        CREATE POLICY "Allow public select access to push_subscriptions" ON push_subscriptions FOR SELECT TO public USING (true);
      END IF;
    END $$;`,

    // Initial Data Inserts
    `INSERT INTO system_settings (key, value, description)
    VALUES ('gdrive_parent_folder', '11xRuReiU4Eyuw5lBOWgn30IMBoWKElGI', 'Folder ID / Link Google Drive Induk')
    ON CONFLICT (key) DO NOTHING;`,

    `INSERT INTO system_settings (key, value, description)
    VALUES (
      'task_definitions_individu',
      '[{"id":"ind-1","name":"Jurnal Harian & Resume","keyword":"jurnal","is_active":true,"deadline":null},{"id":"ind-2","name":"Berkas Administrasi Mandiri","keyword":"administrasi","is_active":true,"deadline":null},{"id":"ind-3","name":"Twibbon & ID Card","keyword":"twibbon","is_active":true,"deadline":null}]',
      'Definisi Tugas Individu per Anggota beserta Keyword dan Deadline'
    )
    ON CONFLICT (key) DO NOTHING;`,

    `INSERT INTO system_settings (key, value, description)
    VALUES (
      'notification_settings',
      '{"enableNewTaskNotif":true,"enableAnnouncementNotif":true,"enableDeadlineNotif":true,"vapidPublicKey":"","vapidPrivateKey":""}',
      'Pengaturan Global Push Notification & Preferensi Notifikasi Admin'
    )
    ON CONFLICT (key) DO NOTHING;`
  ];

  console.log(`Executing ${statements.length} SQL statements sequentially...`);
  let successCount = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      await connectedClient.query(statements[i]);
      successCount++;
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err.message);
    }
  }

  console.log(`Successfully executed ${successCount}/${statements.length} SQL statements.`);
  await connectedClient.end();
}

run();
