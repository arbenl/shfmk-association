-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL DEFAULT 'SHFMK',
  email TEXT NOT NULL DEFAULT 'info@shfmk.org',
  phone TEXT,
  phone2 TEXT,
  address TEXT,
  city TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  linkedin TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_email TEXT
);

-- Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton_idx ON site_settings ((true));

-- Insert default row if not exists
INSERT INTO site_settings (org_name, email)
VALUES ('SHFMK', 'info@shfmk.org')
ON CONFLICT DO NOTHING;

-- Add columns to conferences table
ALTER TABLE conferences
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agenda_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by_email TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS venue_city TEXT;

-- Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings
-- Public read (anon and authenticated)
DROP POLICY IF EXISTS "Public can read site settings" ON site_settings;
CREATE POLICY "Public can read site settings"
ON site_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- RLS Policies for conferences
-- Public read ONLY if published
DROP POLICY IF EXISTS "Public can read published conferences" ON conferences;
CREATE POLICY "Public can read published conferences"
ON conferences
FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Note: Service role bypasses RLS by default, so no specific policy needed for admin updates via API routes.
