-- ============================================================
-- DEALS TABLE - Multi-tenant
-- ============================================================

-- ENUM DEFINITIONS
DO $$ BEGIN
    CREATE TYPE deal_stage AS ENUM ('prospect', 'qualified', 'demo', 'negotiation', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('active', 'won', 'lost', 'on-hold');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DEALS TABLE
CREATE TABLE IF NOT EXISTS deals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    title               VARCHAR(255)  NOT NULL,
    company             VARCHAR(255)  NOT NULL,
    description         TEXT,
    contact_person      VARCHAR(120),
    contact_email       VARCHAR(150),
    contact_phone       VARCHAR(30),

    value               NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(10)   NOT NULL DEFAULT 'USD',

    status              deal_status   NOT NULL DEFAULT 'active',
    stage               deal_stage    NOT NULL DEFAULT 'prospect',

    probability         SMALLINT      NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),

    expected_close_date DATE,

    -- Client link
    client_id           UUID          REFERENCES clients(id) ON DELETE SET NULL,

    assigned_to         UUID          REFERENCES users(id) ON DELETE SET NULL,
    created_by          UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Set by trigger on INSERT from created_at
    generated_month     DATE          NOT NULL DEFAULT DATE_TRUNC('month', NOW())::DATE,

    CONSTRAINT deals_value_positive CHECK (value > 0),
    CONSTRAINT deals_title_not_empty   CHECK (title   <> ''),
    CONSTRAINT deals_company_not_empty CHECK (company <> '')
);

-- ── Triggers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_deal_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_deal_timestamp ON deals;
CREATE TRIGGER trg_update_deal_timestamp
BEFORE UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION update_deal_timestamp();

CREATE OR REPLACE FUNCTION set_generated_month()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.generated_month := DATE_TRUNC('month', NEW.created_at)::DATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_generated_month ON deals;
CREATE TRIGGER trg_set_generated_month
BEFORE INSERT ON deals
FOR EACH ROW EXECUTE FUNCTION set_generated_month();

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- All indexes include organization_id as leading column for multi-tenant queries

DROP INDEX IF EXISTS idx_deals_month_status_value;
DROP INDEX IF EXISTS idx_deals_won_close_time;
DROP INDEX IF EXISTS idx_deals_month_stage;
DROP INDEX IF EXISTS idx_deals_month_assigned_won;
DROP INDEX IF EXISTS idx_deals_month_created_desc;
DROP INDEX IF EXISTS idx_deals_client_id;
DROP INDEX IF EXISTS idx_deals_assigned_status;

CREATE INDEX IF NOT EXISTS idx_deals_org_month_status_value
    ON deals (organization_id, generated_month, status)
    INCLUDE (value);

CREATE INDEX IF NOT EXISTS idx_deals_org_won_close_time
    ON deals (organization_id, generated_month, created_at, updated_at)
    WHERE status = 'won';

CREATE INDEX IF NOT EXISTS idx_deals_org_month_stage
    ON deals (organization_id, generated_month, stage);

CREATE INDEX IF NOT EXISTS idx_deals_org_month_assigned_won
    ON deals (organization_id, generated_month, assigned_to)
    INCLUDE (value)
    WHERE status = 'won';

CREATE INDEX IF NOT EXISTS idx_deals_org_month_created_desc
    ON deals (organization_id, generated_month, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deals_org_client_id
    ON deals (organization_id, client_id)
    WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deals_org_assigned_status
    ON deals (organization_id, assigned_to, status)
    INCLUDE (value);