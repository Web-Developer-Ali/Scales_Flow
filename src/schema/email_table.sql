-- ── EMAIL SETTINGS ────────────────────────────────────────────────────────────
-- Stores admin-configurable email preferences
-- Only one row ever exists (singleton pattern)

CREATE TABLE IF NOT EXISTS email_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Master switch: if false, no emails are sent at all
    enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Which provider to use
    provider VARCHAR(20) NOT NULL DEFAULT 'nodemailer'
        CHECK (provider IN ('nodemailer', 'resend')),

    -- Nodemailer (Gmail or SMTP)
    smtp_service  VARCHAR(50),   -- 'gmail' or null for custom SMTP
    smtp_host     VARCHAR(255),  -- e.g. smtp.gmail.com
    smtp_port     INTEGER,       -- e.g. 587
    smtp_user     VARCHAR(255),
    smtp_password TEXT,          -- encrypted at app layer before storing
    smtp_from     VARCHAR(255),  -- display name + address

    -- Resend
    resend_api_key TEXT,
    resend_from    VARCHAR(255),

    -- Which notification types are enabled
    notify_deal_won            BOOLEAN NOT NULL DEFAULT TRUE,
    notify_deal_stalled        BOOLEAN NOT NULL DEFAULT TRUE,
    notify_monthly_target      BOOLEAN NOT NULL DEFAULT TRUE,
    notify_welcome_member      BOOLEAN NOT NULL DEFAULT TRUE,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Only ever one settings row
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_settings_singleton
    ON email_settings ((TRUE));

-- Seed default row so the app always has something to read
INSERT INTO email_settings (enabled, provider)
VALUES (FALSE, 'nodemailer')
ON CONFLICT DO NOTHING;