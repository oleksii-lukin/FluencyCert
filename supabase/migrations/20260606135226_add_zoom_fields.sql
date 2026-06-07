ALTER TABLE profiles ADD COLUMN zoom_access_token TEXT;
ALTER TABLE profiles ADD COLUMN zoom_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN zoom_token_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN zoom_user_info JSONB;
