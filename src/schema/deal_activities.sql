CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dealId UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    type activity_type NOT NULL,

    subject VARCHAR(255) NOT NULL,
    description TEXT,

    dueDate TIMESTAMP,        -- for tasks/meetings
    completed BOOLEAN DEFAULT FALSE,

    createdBy UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assignedTo UUID REFERENCES users(id) ON DELETE SET NULL,

    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);


-- auto update trigger 

CREATE TRIGGER update_activity_timestamp
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- Activities created this month
CREATE INDEX idx_activities_created_month
ON activities(createdAt)
WHERE createdAt >= date_trunc('month', now());

-- Filter by activity type this month
CREATE INDEX idx_activities_type_month
ON activities(type)
WHERE createdAt >= date_trunc('month', now());

-- Activity by user this month
CREATE INDEX idx_activities_assigned_month
ON activities(assignedTo, createdAt)
WHERE createdAt >= date_trunc('month', now());

-- Activities for each deal this month
CREATE INDEX idx_activities_deal_month
ON activities(dealId, createdAt)
WHERE createdAt >= date_trunc('month', now());
