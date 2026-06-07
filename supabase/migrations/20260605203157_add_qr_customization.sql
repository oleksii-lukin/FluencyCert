ALTER TABLE pdf_template_fields
ADD COLUMN qr_dots_color TEXT NOT NULL DEFAULT '#1a1a2e',
ADD COLUMN qr_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
ADD COLUMN qr_dots_type TEXT NOT NULL DEFAULT 'rounded',
ADD COLUMN qr_corners_type TEXT NOT NULL DEFAULT 'square',
ADD COLUMN qr_corners_color TEXT NOT NULL DEFAULT '#1a1a2e';
