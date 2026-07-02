-- ─── ENUMS ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_activity_type AS ENUM (
    'login', 'logout', 'password_change', 'profile_update',
    'deal_created', 'deal_updated', 'deal_deleted',
    'user_created', 'user_blocked', 'user_unblocked', 'user_deleted',
    'team_assigned' , 'email_verified' , 'client_created' , 'client_updated' , 'client_deleted' 
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


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
