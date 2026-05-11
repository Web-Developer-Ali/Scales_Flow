-- ─── ENUMS ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'call', 'email', 'meeting', 'follow_up',
    'demo', 'proposal', 'negotiation', 'note', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_activity_type AS ENUM (
    'login', 'logout', 'password_change', 'profile_update',
    'deal_created', 'deal_updated', 'deal_deleted',
    'user_created', 'user_blocked', 'user_unblocked', 'user_deleted',
    'team_assigned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── DEAL ACTIVITIES ──────────────────────────────────────────────────────────
-- Tracks calls, emails, meetings, follow-ups tied to a specific deal

CREATE TABLE IF NOT EXISTS deal_activities (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

    deal_id      UUID         NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    type         activity_type NOT NULL,

    subject      VARCHAR(255) NOT NULL,
    description  TEXT,

    due_date     TIMESTAMPTZ,           -- for scheduled tasks/meetings
    completed    BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,           -- set when completed = true

    created_by   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to  UUID         REFERENCES users(id) ON DELETE SET NULL,

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION update_deal_activity_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Auto-set completed_at when marked complete
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deal_activity_timestamp ON deal_activities;
CREATE TRIGGER trg_deal_activity_timestamp
BEFORE UPDATE ON deal_activities
FOR EACH ROW EXECUTE FUNCTION update_deal_activity_timestamp();

-- Indexes — NO partial indexes with NOW() (not immutable)
-- All activities for a deal, newest first
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id
    ON deal_activities (deal_id, created_at DESC);

-- Pending tasks assigned to a user (for "Needs Attention" queries)
CREATE INDEX IF NOT EXISTS idx_deal_activities_assigned_pending
    ON deal_activities (assigned_to, due_date)
    WHERE completed = FALSE;

-- Filter by type
CREATE INDEX IF NOT EXISTS idx_deal_activities_type
    ON deal_activities (type, created_at DESC);


-- ─── DEAL NOTES ───────────────────────────────────────────────────────────────
-- Free-form notes attached to a deal (separate from structured activities)

CREATE TABLE IF NOT EXISTS deal_notes (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    deal_id     UUID        NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    content     TEXT        NOT NULL CHECK (content <> ''),

    created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_deal_note_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deal_note_timestamp ON deal_notes;
CREATE TRIGGER trg_deal_note_timestamp
BEFORE UPDATE ON deal_notes
FOR EACH ROW EXECUTE FUNCTION update_deal_note_timestamp();

-- All notes for a deal, newest first
CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id
    ON deal_notes (deal_id, created_at DESC);

-- Notes written by a specific user
CREATE INDEX IF NOT EXISTS idx_deal_notes_created_by
    ON deal_notes (created_by, created_at DESC);


-- ─── USER ACTIVITIES ──────────────────────────────────────────────────────────
-- Audit log: every important action in the system

CREATE TABLE IF NOT EXISTS user_activities (
    id             UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id        UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    performed_by   UUID                 REFERENCES users(id) ON DELETE SET NULL,

    activity_type  user_activity_type   NOT NULL,

    description    TEXT,

    -- Context: what entity was affected (optional)
    entity_type    VARCHAR(50),         -- 'deal', 'user', 'team' etc.
    entity_id      UUID,                -- id of the affected entity

    ip_address     INET,
    user_agent     TEXT,

    created_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW()
    -- No updated_at — audit logs are immutable, never updated
);

-- user_activities is append-only — NO update trigger needed

-- All activity for a specific user, newest first
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id
    ON user_activities (user_id, created_at DESC);

-- Actions performed by admins/managers
CREATE INDEX IF NOT EXISTS idx_user_activities_performed_by
    ON user_activities (performed_by, created_at DESC);

-- Filter by activity type (for admin audit views)
CREATE INDEX IF NOT EXISTS idx_user_activities_type
    ON user_activities (activity_type, created_at DESC);

-- Entity-level audit trail (find all events affecting a deal)
CREATE INDEX IF NOT EXISTS idx_user_activities_entity
    ON user_activities (entity_type, entity_id, created_at DESC)
    WHERE entity_id IS NOT NULL;


-- ─── DEALS TABLE: add missing columns ────────────────────────────────────────
-- Your add-deal form has description + title — add them if not already present

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS title       VARCHAR(255);

-- Backfill title from company for existing rows
UPDATE deals SET title = company WHERE title IS NULL;

-- Make title NOT NULL after backfill
ALTER TABLE deals ALTER COLUMN title SET NOT NULL;