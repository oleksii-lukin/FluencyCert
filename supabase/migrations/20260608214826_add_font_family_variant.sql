ALTER TABLE pdf_fonts
  ADD COLUMN family TEXT NOT NULL DEFAULT '',
  ADD COLUMN variant TEXT NOT NULL DEFAULT 'regular';

CREATE INDEX idx_pdf_fonts_family ON pdf_fonts(family);
