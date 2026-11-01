-- Fresh save-only collection. No retired waitlist or installer-invite imports.
-- The owner explicitly chose single opt-in: no mail is sent and addresses stay unverified.
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  consent_scope TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consent_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL CHECK (source IN ('home', 'download')),
  verification TEXT NOT NULL DEFAULT 'unverified' CHECK (verification = 'unverified')
);
CREATE INDEX IF NOT EXISTS subscribers_consent_at ON subscribers(consent_at);
