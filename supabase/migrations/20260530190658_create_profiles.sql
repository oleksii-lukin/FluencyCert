CREATE TABLE profiles (
  id            UUID PRIMARY KEY,
  email         TEXT NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  username      TEXT,
  phone_number  TEXT,
  avatar_url    TEXT,
  linkedin_url  TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_is_admin ON profiles (is_admin);
CREATE INDEX idx_profiles_email ON profiles (email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
