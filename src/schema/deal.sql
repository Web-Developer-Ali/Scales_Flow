-- ========================================================
-- ENUM DEFINITIONS
-- ========================================================

DO $$ BEGIN
    CREATE TYPE deal_stage AS ENUM ('prospect', 'qualified', 'demo', 'negotiation', 'closed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('active', 'won', 'lost', 'on-hold');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ========================================================
-- DEALS TABLE
-- ========================================================

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,

    contactPerson VARCHAR(120),
    contactEmail VARCHAR(150),
    contactPhone VARCHAR(30),

    value NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',

    status deal_status NOT NULL DEFAULT 'active',
    stage deal_stage NOT NULL DEFAULT 'prospect',

    probability INT NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),

    expectedCloseDate DATE,

    assignedTo UUID REFERENCES users(id) ON DELETE SET NULL,
    createdBy UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    generated_month DATE
);


-- ========================================================
-- TRIGGERS
-- ========================================================

-- Auto update updatedAt
CREATE OR REPLACE FUNCTION update_deal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_deal_timestamp
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION update_deal_timestamp();


-- Generate `generated_month` from createdAt
CREATE OR REPLACE FUNCTION set_generated_month()
RETURNS TRIGGER AS $$
BEGIN
    NEW.generated_month := date_trunc('month', NEW.createdAt)::date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_generated_month
BEFORE INSERT ON deals
FOR EACH ROW
EXECUTE FUNCTION set_generated_month();


-- ========================================================
-- INDEXES
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_deals_month
ON deals (generated_month);

CREATE INDEX IF NOT EXISTS idx_deals_month_status
ON deals (generated_month, status);

CREATE INDEX IF NOT EXISTS idx_deals_month_stage
ON deals (generated_month, stage);

CREATE INDEX IF NOT EXISTS idx_deals_month_assigned
ON deals (generated_month, assignedTo);

