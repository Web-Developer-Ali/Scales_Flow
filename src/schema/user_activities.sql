-- ============================================================
-- USER ACTIVITIES TABLE - Multi-tenant
-- ============================================================

-- ─── ENUMS ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_activity_type AS ENUM (
    'login', 'logout', 'password_change', 'profile_update',
    'deal_created', 'deal_updated', 'deal_deleted',
    'user_created', 'user_blocked', 'user_unblocked', 'user_deleted',
    'team_assigned', 'email_verified', 'client_created', 'client_updated', 'client_deleted'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── USER ACTIVITIES ──────────────────────────────────────────────────────────
-- Audit log: every important action in the system

CREATE TABLE IF NOT EXISTS user_activities (
    id             UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

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

-- ─── Indexes ───────────────────────────────────────────────────────────────────
-- All indexes include organization_id as leading column

DROP INDEX IF EXISTS idx_user_activities_user_id;
DROP INDEX IF EXISTS idx_user_activities_performed_by;
DROP INDEX IF EXISTS idx_user_activities_type;
DROP INDEX IF EXISTS idx_user_activities_entity;

CREATE INDEX IF NOT EXISTS idx_user_activities_org_user_id
    ON user_activities (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_org_performed_by
    ON user_activities (organization_id, performed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_org_type
    ON user_activities (organization_id, activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_org_entity
    ON user_activities (organization_id, entity_type, entity_id, created_at DESC)
    WHERE entity_id IS NOT NULL;