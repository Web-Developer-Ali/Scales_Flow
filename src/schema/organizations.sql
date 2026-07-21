-- ============================================================
-- SALESFLOW CRM — 00_ORGANIZATIONS.SQL
-- SaaS multi-tenant migration
-- Run this FIRST before any other migration file
-- ============================================================

-- ── ORGANIZATIONS TABLE ───────────────────────────────────────────────────────
-- Root tenant table. Every other table FKs into this.
-- One row = one agency using the CRM.

CREATE TABLE IF NOT EXISTS organizations (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

    name          VARCHAR(150) NOT NULL,

    -- URL-safe identifier: used in login page (?org=acme) or subdomain routing
    -- Set once at signup, never changed
    slug          VARCHAR(100) NOT NULL,

    -- Billing / trial state
    plan          VARCHAR(20)  NOT NULL DEFAULT 'trial'
                  CHECK (plan IN ('trial', 'paid', 'expired')),

    trial_ends_at TIMESTAMPTZ,           -- NULL = no trial limit (paid)

    -- Master kill switch — set to false to lock out an entire agency
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT organizations_name_not_empty CHECK (name <> ''),
    CONSTRAINT organizations_slug_not_empty CHECK (slug <> ''),

    -- slug must be lowercase, alphanumeric + hyphens only
    -- e.g. "acme-marketing", "best-agency"
    CONSTRAINT organizations_slug_format
        CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{1,98}[a-z0-9]$')
);

-- slug is used in every login request — must be unique and fast
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
    ON organizations (slug);

-- Admin queries: list all orgs by plan or status
CREATE INDEX IF NOT EXISTS idx_organizations_plan
    ON organizations (plan, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organizations_active
    ON organizations (is_active)
    WHERE is_active = TRUE;

-- ── TRIGGER: updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_organization_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_organization_timestamp ON organizations;
CREATE TRIGGER trg_update_organization_timestamp
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_organization_timestamp();