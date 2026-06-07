ALTER TABLE certificate_claims
  ADD COLUMN english_level TEXT,
  ADD COLUMN speaking_clubs_count INTEGER,
  ADD COLUMN hours_participated INTEGER,
  ADD COLUMN background_template TEXT DEFAULT 'guilloche-security';

CREATE TABLE certificate_feedback (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id           UUID NOT NULL REFERENCES certificate_claims(id) ON DELETE CASCADE,
  reviewer_id              TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feedback_text            TEXT NOT NULL,
  display_name_preference  TEXT NOT NULL DEFAULT 'nickname'
                              CHECK (display_name_preference IN ('nickname', 'full_name')),
  linkedin_url             TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  sort_order               INTEGER NOT NULL DEFAULT 0,
  is_visible               BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_certificate_feedback_cert_id ON certificate_feedback (certificate_id);
CREATE INDEX idx_certificate_feedback_reviewer ON certificate_feedback (reviewer_id);

CREATE TRIGGER set_certificate_feedback_updated_at
  BEFORE UPDATE ON certificate_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE certificate_upvotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id  UUID NOT NULL REFERENCES certificate_claims(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(certificate_id, user_id)
);

CREATE INDEX idx_certificate_upvotes_cert_id ON certificate_upvotes (certificate_id);
