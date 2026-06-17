-- Add storage for pre-generated certificate PDF files

ALTER TABLE certificate_claims
  ADD COLUMN pdf_file_url text,
  ADD COLUMN pdf_file_key text;

-- Trigger-based cleanup when a claim is deleted
-- Requires pg_net extension: create extension if not exists pg_net;
-- CREATE OR REPLACE FUNCTION public.handle_deleted_claim_pdf()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   IF OLD.pdf_file_key IS NOT NULL THEN
--     PERFORM
--       net.http_post(
--         url := current_setting('app.settings.cleanup_pdf_url', true),
--         headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', concat('Bearer ', current_setting('app.settings.cleanup_pdf_secret', true))
--         ),
--         body := jsonb_build_object('fileKey', OLD.pdf_file_key)::text
--       );
--   END IF;
--   RETURN OLD;
-- END;
-- $$;

-- CREATE TRIGGER cleanup_certificate_pdf_trigger
--   AFTER DELETE ON certificate_claims
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_deleted_claim_pdf();
