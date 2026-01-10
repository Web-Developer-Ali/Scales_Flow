-- Create ENUM for deal stage
DO $$ BEGIN
    CREATE TYPE deal_stage AS ENUM ('prospect', 'qualified', 'demo', 'negotiation', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ENUM for deal status
DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('active', 'won', 'lost', 'on-hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Deal Table
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

    probability INT CHECK (probability BETWEEN 0 AND 100),

    expectedCloseDate DATE,

    -- fixed constraint to avoid error
    assignedTo UUID REFERENCES users(id) ON DELETE SET NULL,

    createdBy UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- auto update trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deal_timestamp
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- INDEXES FOR CURRENT MONTH

-- deals created this month
CREATE INDEX idx_deals_created_this_month 
ON deals (createdAt)
WHERE createdAt >= date_trunc('month', now());

-- deals updated this month
CREATE INDEX idx_deals_updated_this_month 
ON deals (updatedAt)
WHERE updatedAt >= date_trunc('month', now());

-- closed deals assigned to rep this month
CREATE INDEX idx_deals_status_assigned_updated_month 
ON deals (status, assignedTo, updatedAt)
WHERE updatedAt >= date_trunc('month', now());

-- new deals assigned this month
CREATE INDEX idx_deals_assigned_created_month 
ON deals (assignedTo, createdAt)
WHERE createdAt >= date_trunc('month', now());

-- stage stats this month
CREATE INDEX idx_deals_stage_month 
ON deals (stage)
WHERE createdAt >= date_trunc('month', now());

-- additional: stage + status this month (recommended)
CREATE INDEX idx_deals_stage_status_month
ON deals(stage, status)
WHERE createdAt >= date_trunc('month', now());
