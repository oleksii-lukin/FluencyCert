ALTER TABLE pdf_template_fields
  ADD COLUMN date_format TEXT DEFAULT NULL CHECK (date_format IN ('usa', 'gb', 'locale')),
  ADD COLUMN level_format TEXT DEFAULT NULL CHECK (level_format IN ('short', 'text', 'long')),
  ADD COLUMN text_color TEXT DEFAULT NULL;
