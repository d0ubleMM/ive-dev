-- Additive migration: preserve every existing row, without confirming or emailing it.
ALTER TABLE subscribers RENAME COLUMN verification TO initial_verification;
ALTER TABLE subscribers ADD COLUMN pending_expires_at TEXT;
ALTER TABLE subscribers ADD COLUMN confirmed_at TEXT;
ALTER TABLE subscribers ADD COLUMN confirmation_method TEXT CHECK (confirmation_method IS NULL OR confirmation_method = 'email-link');
CREATE TABLE confirmation_tokens (
  token_hash TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  send_status TEXT NOT NULL DEFAULT 'reserved' CHECK (send_status IN ('reserved','accepted','failed')),
  used_at TEXT
);
CREATE INDEX confirmation_tokens_subscriber ON confirmation_tokens(subscriber_id, created_at);
CREATE TABLE send_budget (
  day TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 500)
);
