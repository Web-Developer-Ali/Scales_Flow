CREATE TABLE IF NOT EXISTS deal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dealId UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    
    createdBy UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_deal_month
ON notes(dealId, createdAt)
WHERE createdAt >= date_trunc('month', now());

