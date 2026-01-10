CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL 
        REFERENCES users(id) ON DELETE CASCADE,

    performed_by UUID 
        REFERENCES users(id) ON DELETE SET NULL,
        -- who triggered the event (admin/manager/user)

    activity_type VARCHAR(50) NOT NULL,

    description TEXT,

    ip_address INET,            -- IPv4 or IPv6 tracking
    user_agent TEXT,            -- browser/device tracking

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Filter activities for current month
CREATE INDEX idx_user_activities_current_month
ON user_activities (created_at)
WHERE created_at >= date_trunc('month', now());

-- Quickly find activities by user
CREATE INDEX idx_user_activities_user
ON user_activities (user_id);

-- Find actions performed by someone else (admin/manager)
CREATE INDEX idx_user_activities_performed_by
ON user_activities (performed_by);
