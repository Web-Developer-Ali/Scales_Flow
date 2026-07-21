-- ============================================================
-- NOTIFICATIONS TABLE - Multi-tenant
-- ============================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'deal_assigned',
    'deal_stage_changed',
    'deal_won',
    'deal_lost',
    'deal_stalled',
    'monthly_target_reminder',
    'team_member_created',
    'deal_commented',
    'deal_deleted'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Who receives this notification
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type    notification_type NOT NULL,
    title   VARCHAR(255)      NOT NULL,
    message TEXT              NOT NULL,

    -- Optional: link to the related entity so clicking navigates there
    entity_type VARCHAR(50),   -- 'deal', 'user', 'client'
    entity_id   UUID,

    -- Read state
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at    TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No updated_at — notifications are immutable once created
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- All indexes include organization_id as leading column

DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_entity;

CREATE INDEX IF NOT EXISTS idx_notifications_org_user_unread
    ON notifications (organization_id, user_id, created_at DESC)
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_org_user_id
    ON notifications (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_org_entity
    ON notifications (organization_id, entity_type, entity_id)
    WHERE entity_id IS NOT NULL;

-- ── Helper function: create a notification ────────────────────────────────────
CREATE OR REPLACE FUNCTION create_notification(
    p_organization_id UUID,
    p_user_id         UUID,
    p_type            notification_type,
    p_title           VARCHAR,
    p_message         TEXT,
    p_entity_type     VARCHAR DEFAULT NULL,
    p_entity_id       UUID    DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (
        organization_id, user_id, type, title, message, entity_type, entity_id
    )
    VALUES (
        p_organization_id, p_user_id, p_type, p_title, p_message,
        p_entity_type, p_entity_id
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;