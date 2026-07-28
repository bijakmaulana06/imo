-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- 1. ANNOUNCEMENTS TABLE
-- =========================================================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for announcements
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to announcements" 
ON announcements FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow admin write access to announcements" 
ON announcements FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- =========================================================================
-- 2. HUB LINKS TABLE
-- =========================================================================
CREATE TABLE hub_links (
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
);

-- Trigger for hub_links
CREATE TRIGGER update_hub_links_updated_at
BEFORE UPDATE ON hub_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE hub_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to hub_links" 
ON hub_links FOR SELECT 
TO public 
USING (is_active = true);

CREATE POLICY "Allow admin write access to hub_links" 
ON hub_links FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- =========================================================================
-- 3. ID CARD TEMPLATES TABLE
-- =========================================================================
CREATE TABLE id_card_templates (
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
);

-- Trigger for id_card_templates
CREATE TRIGGER update_id_card_templates_updated_at
BEFORE UPDATE ON id_card_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE id_card_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to id_card_templates" 
ON id_card_templates FOR SELECT 
TO public 
USING (is_active = true);

CREATE POLICY "Allow admin write access to id_card_templates" 
ON id_card_templates FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- =========================================================================
-- 4. CONTACT PERSONS TABLE
-- =========================================================================
CREATE TABLE contact_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'LO', 'Pendamping'
    group_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    instagram TEXT,
    photo_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for contact_persons
CREATE TRIGGER update_contact_persons_updated_at
BEFORE UPDATE ON contact_persons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE contact_persons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to contact_persons" 
ON contact_persons FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow admin write access to contact_persons" 
ON contact_persons FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- =========================================================================
-- 5. DOCUMENT TEMPLATES TABLE (Auto Form Fill)
-- =========================================================================
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    fields_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for document_templates
CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to document_templates" 
ON document_templates FOR SELECT 
TO public 
USING (is_active = true);

CREATE POLICY "Allow admin write access to document_templates" 
ON document_templates FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- =========================================================================
-- 6. STORAGE BUCKETS SETUP (Run via dashboard if possible, or instructions)
-- =========================================================================
-- Note: Supabase storage buckets must be created manually or via migrations if using CLI.
-- Buckets to create: 'templates', 'avatars', 'logos'
-- We'll write policies for these buckets to allow public read and admin write.

