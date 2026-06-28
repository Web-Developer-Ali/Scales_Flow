-- ── ENUM ──────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('prospect', 'active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── CLIENTS TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  company_name          VARCHAR(255)  NOT NULL,
  industry              VARCHAR(100),
  website               VARCHAR(255),
  address               TEXT,

  primary_contact_name  VARCHAR(120),
  primary_contact_email VARCHAR(150),
  primary_contact_phone VARCHAR(30),

  status                client_status NOT NULL DEFAULT 'prospect',

  notes                 TEXT,

  assigned_to           UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_by            UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT clients_company_not_empty CHECK (company_name <> '')
);

-- ── TRIGGER: updated_at ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_client_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_client_timestamp ON clients;
CREATE TRIGGER trg_update_client_timestamp
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_client_timestamp();

-- ── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to
  ON clients (assigned_to);

CREATE INDEX IF NOT EXISTS idx_clients_status
  ON clients (status);

CREATE INDEX IF NOT EXISTS idx_clients_created_by
  ON clients (created_by);

-- Fast search by company name (case-insensitive via ILIKE)
CREATE INDEX IF NOT EXISTS idx_clients_company_name
  ON clients (company_name);

-- ── 3D: Link deals to clients ─────────────────────────────────────────────────
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_client_id
  ON deals (client_id)
  WHERE client_id IS NOT NULL;