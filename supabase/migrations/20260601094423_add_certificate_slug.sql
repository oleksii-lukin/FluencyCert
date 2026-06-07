ALTER TABLE public.certificate_claims ADD COLUMN slug TEXT;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION generate_certificate_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  slug TEXT;
  attempt INT := 0;
BEGIN
  LOOP
    attempt := attempt + 1;
    slug := '';
    FOR i IN 1..6 LOOP
      slug := slug || substr(chars, floor(random() * 36 + 1)::INTEGER, 1);
    END LOOP;
    BEGIN
      RETURN slug;
    EXCEPTION WHEN unique_violation THEN
      IF attempt > 10 THEN RAISE 'Could not generate unique slug'; END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

UPDATE public.certificate_claims
SET slug = generate_certificate_slug()
WHERE slug IS NULL;

ALTER TABLE public.certificate_claims ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.certificate_claims ADD CONSTRAINT certificate_claims_slug_key UNIQUE (slug);

CREATE INDEX idx_certificate_claims_slug ON public.certificate_claims (slug);
