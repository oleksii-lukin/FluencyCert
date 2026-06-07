ALTER TABLE profiles
  ADD COLUMN telegram_id TEXT UNIQUE,
  ADD COLUMN telegram_username TEXT;
