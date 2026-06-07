CREATE TABLE speaking_clubs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_speaking_clubs_slug ON speaking_clubs(slug);

CREATE TRIGGER set_speaking_clubs_updated_at
  BEFORE UPDATE ON speaking_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE club_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID NOT NULL REFERENCES speaking_clubs(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_memberships_club_id  ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_user_id ON club_memberships(user_id);

ALTER TABLE certificate_claims
  ADD COLUMN club_id UUID REFERENCES speaking_clubs(id) ON DELETE SET NULL;

CREATE INDEX idx_certificate_claims_club_id ON certificate_claims(club_id);

ALTER TABLE pdf_templates
  ADD COLUMN club_id UUID REFERENCES speaking_clubs(id) ON DELETE CASCADE;

CREATE INDEX idx_pdf_templates_club_id ON pdf_templates(club_id);
