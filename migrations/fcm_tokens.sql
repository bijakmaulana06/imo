-- =========================================================================
-- Migration: FCM Tokens Table
-- Jalankan di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pcalfbxvlbmqbhhazbax/sql
-- =========================================================================

-- Tabel untuk menyimpan FCM Registration Token perangkat pengguna
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT NOT NULL UNIQUE,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk lookup cepat berdasarkan token
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);

-- Index untuk lookup berdasarkan user_id (kirim notif ke user tertentu)
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- Trigger: auto-update updated_at
CREATE TRIGGER update_fcm_tokens_updated_at
BEFORE UPDATE ON fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security (RLS) ───────────────────────────────────────────────

ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Hanya service_role (API server) yang bisa insert/update/delete
-- User biasa tidak bisa baca token orang lain

DROP POLICY IF EXISTS "Service role can manage fcm_tokens" ON fcm_tokens;
CREATE POLICY "Service role can manage fcm_tokens"
ON fcm_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- (Opsional) Izinkan user yang login untuk membaca token miliknya sendiri
DROP POLICY IF EXISTS "Users can read own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can read own fcm tokens"
ON fcm_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
