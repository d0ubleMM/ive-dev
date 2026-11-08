-- Fresh databases only; existing installations use migrations/0001_double_opt_in.sql.
-- initial_verification describes the original submission, never the current mail eligibility.
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  consent_scope TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consent_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL CHECK (source IN ('home', 'download')),
  initial_verification TEXT NOT NULL DEFAULT 'unverified' CHECK (initial_verification = 'unverified'),
  pending_expires_at TEXT,
  confirmed_at TEXT,
  confirmation_method TEXT CHECK (confirmation_method IS NULL OR confirmation_method = 'email-link')
);
CREATE INDEX IF NOT EXISTS subscribers_consent_at ON subscribers(consent_at);
CREATE TABLE IF NOT EXISTS confirmation_tokens (
  token_hash TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  send_status TEXT NOT NULL DEFAULT 'reserved' CHECK (send_status IN ('reserved','accepted','failed')),
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS confirmation_tokens_subscriber ON confirmation_tokens(subscriber_id, created_at);
CREATE TABLE IF NOT EXISTS send_budget (
  day TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 500)
);
