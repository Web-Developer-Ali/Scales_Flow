-- ============================================================
-- SALESFLOW CRM — 04_NOTIFICATIONS.SQL
-- Run after 01_users.sql and 02_deals.sql
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

-- Primary query: "give me all unread notifications for this user"
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read, created_at DESC)
    WHERE is_read = FALSE;

-- All notifications for a user (notification history)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications (user_id, created_at DESC);

-- Entity-level: find notifications related to a specific deal
CREATE INDEX IF NOT EXISTS idx_notifications_entity
    ON notifications (entity_type, entity_id)
    WHERE entity_id IS NOT NULL;

-- ── Helper function: create a notification ────────────────────────────────────
-- Called from API routes — never directly from client

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id     UUID,
    p_type        notification_type,
    p_title       VARCHAR,
    p_message     TEXT,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id   UUID    DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id
    )
    VALUES (
        p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;