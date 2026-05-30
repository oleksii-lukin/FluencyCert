CREATE TABLE certificate_claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_feedback TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_certificate_claims_user_id ON certificate_claims (user_id);
CREATE INDEX idx_certificate_claims_status ON certificate_claims (status);

CREATE TRIGGER set_certificate_claims_updated_at
  BEFORE UPDATE ON certificate_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
