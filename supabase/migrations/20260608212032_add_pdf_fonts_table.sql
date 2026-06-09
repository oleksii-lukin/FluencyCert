CREATE TABLE pdf_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_fonts_name ON pdf_fonts(name);

CREATE TRIGGER set_pdf_fonts_updated_at
  BEFORE UPDATE ON pdf_fonts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE pdf_template_fields
  ADD COLUMN font_id UUID REFERENCES pdf_fonts(id) ON DELETE SET NULL;
