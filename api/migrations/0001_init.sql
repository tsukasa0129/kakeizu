-- Accounts are identified by email; login is a 6-digit code sent by email (no passwords).
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

-- One pending code per email. Only the hash is stored; attempts are capped.
CREATE TABLE login_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL
);

-- Every code sent, for rate limiting per email and per IP. Rows older than a day are pruned.
CREATE TABLE code_sends (
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);
CREATE INDEX code_sends_email ON code_sends (email, sent_at);
CREATE INDEX code_sends_ip ON code_sends (ip, sent_at);

-- Bearer tokens (SHA-256 hashed). One row per signed-in device.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- The app's state (family tree + progress) as one JSON document per user.
-- `version` increases on every write so devices can detect that another device saved first.
CREATE TABLE user_data (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
