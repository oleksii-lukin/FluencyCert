-- PDF certificate template management
-- Admins upload PDF templates with AcroForm fields, configure value mapping

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_templates_created_at ON pdf_templates(created_at DESC);

CREATE TRIGGER set_pdf_templates_updated_at
  BEFORE UPDATE ON pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE pdf_template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES pdf_templates(id) ON DELETE CASCADE,
  pdf_field_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('database', 'custom', 'qr_code')),
  source_key TEXT,
  display_label TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  font_family TEXT NOT NULL DEFAULT 'Inter',
  font_size INTEGER NOT NULL DEFAULT 12,
  font_source TEXT NOT NULL DEFAULT 'google' CHECK (font_source IN ('google', 'uploaded')),
  uploaded_font_key TEXT,
  custom_default_value TEXT,
  custom_overridable BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_template_fields_template_id ON pdf_template_fields(template_id);

CREATE TRIGGER set_pdf_template_fields_updated_at
  BEFORE UPDATE ON pdf_template_fields
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE pdf_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES certificate_claims(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES pdf_template_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(claim_id, field_id)
);

CREATE INDEX idx_pdf_custom_values_claim_id ON pdf_custom_values(claim_id);

CREATE TRIGGER set_pdf_custom_values_updated_at
  BEFORE UPDATE ON pdf_custom_values
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE certificate_claims
  ADD COLUMN pdf_template_id UUID REFERENCES pdf_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_certificate_claims_pdf_template_id ON certificate_claims(pdf_template_id);
