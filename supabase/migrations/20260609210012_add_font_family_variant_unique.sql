ALTER TABLE pdf_fonts ADD CONSTRAINT pdf_fonts_family_variant_key UNIQUE (family, variant);
