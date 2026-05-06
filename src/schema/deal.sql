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

    title               VARCHAR(255)  NOT NULL,
    company             VARCHAR(255)  NOT NULL,

    contact_person      VARCHAR(120),
    contact_email       VARCHAR(150),
    contact_phone       VARCHAR(30),

    value               NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(10)   NOT NULL DEFAULT 'USD',

    status              deal_status   NOT NULL DEFAULT 'active',
    stage               deal_stage    NOT NULL DEFAULT 'prospect',

    probability         SMALLINT      NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),

    expected_close_date DATE,

    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    generated_month     DATE          NOT NULL DEFAULT DATE_TRUNC('month', NOW())::DATE
);

-- ── Trigger: keep updated_at fresh ───────────────────────────────────────────
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

-- ── Trigger: set generated_month from created_at on INSERT ───────────────────
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

-- Queries 1 & 2: SUM(value) WHERE generated_month + status
CREATE INDEX IF NOT EXISTS idx_deals_month_status_value
    ON deals (generated_month, status)
    INCLUDE (value);

-- Query 4: AVG close time for won deals only
CREATE INDEX IF NOT EXISTS idx_deals_won_close_time
    ON deals (generated_month, created_at, updated_at)
    WHERE status = 'won';

-- Query 5: GROUP BY stage WHERE generated_month
CREATE INDEX IF NOT EXISTS idx_deals_month_stage
    ON deals (generated_month, stage);

-- Query 6: team performance join
CREATE INDEX IF NOT EXISTS idx_deals_month_assigned_won
    ON deals (generated_month, assigned_to)
    INCLUDE (value)
    WHERE status = 'won';

-- Query 7: recent deals ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_deals_month_created_desc
    ON deals (generated_month, created_at DESC);