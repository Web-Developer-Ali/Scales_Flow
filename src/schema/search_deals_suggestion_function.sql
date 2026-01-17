-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index on deal table for serch suggestion.
CREATE INDEX IF NOT EXISTS idx_deals_search_trgm
ON deals
USING gin (
    (title || ' ' || company || ' ' || COALESCE(contactPerson, ''))
    gin_trgm_ops
);

-- Function use to get serch suggestions.
CREATE OR REPLACE FUNCTION search_deals_suggestions(
    query TEXT,
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    company TEXT,
    contactPerson TEXT,
    score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.company,
        d.contactPerson,
        similarity(
            query,
            d.title || ' ' || d.company || ' ' || COALESCE(d.contactPerson, '')
        ) AS score
    FROM deals d
    WHERE
        (d.title || ' ' || d.company || ' ' || COALESCE(d.contactPerson, ''))
        % query
    ORDER BY score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
