-- ============================================================
-- SALESFLOW CRM — 01_USERS_SAAS.SQL
-- SaaS multi-tenant migration
-- Run after 00_organizations.sql
-- ============================================================

-- ── STEP 1: EXTENSIONS ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── STEP 2: CREATE USERS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- AUTH
    email CITEXT NOT NULL,
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'credentials',
    password_hash VARCHAR(255),

    -- OAuth (future-safe)
    provider_id TEXT,

    -- PROFILE
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100),

    -- ROLES
    role VARCHAR(20) NOT NULL DEFAULT 'scales_man',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- EMAIL OTP
    email_otp VARCHAR(6),
    email_otp_expires_at TIMESTAMPTZ,

    -- PASSWORD RESET OTP
    reset_password_otp VARCHAR(6),
    reset_password_otp_expires_at TIMESTAMPTZ,

    -- AUTH TRACKING
    last_login_at TIMESTAMPTZ,
    login_count INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login_at TIMESTAMPTZ,
    must_reset_password BOOLEAN NOT NULL DEFAULT FALSE,

    -- ACCOUNT STATUS
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- TIMESTAMPS
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ── CONSTRAINTS ─────────────────────────────────────────────────────────────

    -- Role validation
    CONSTRAINT users_role_check CHECK (
        role IN ('admin', 'manager', 'scales_man')
    ),

    -- Auth validation
    CONSTRAINT users_auth_check CHECK (
        (auth_provider = 'credentials' AND password_hash IS NOT NULL)
        OR
        (auth_provider IN ('google', 'github'))
    ),

    -- Prevent empty email
    CONSTRAINT users_email_not_empty CHECK (email <> ''),

    -- Prevent a user from being their own manager
    CONSTRAINT users_no_self_manager CHECK (manager_id <> id),
    CONSTRAINT users_no_self_creator CHECK (created_by <> id)
);

-- ── STEP 3: INDEXES ──────────────────────────────────────────────────────────
-- Email unique PER organization (same email can exist in different orgs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_per_org
    ON users (organization_id, email);

-- One admin per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_admin_per_org
    ON users (organization_id)
    WHERE role = 'admin';

-- All indexes with organization_id as leading column
CREATE INDEX IF NOT EXISTS idx_users_org_role
    ON users (organization_id, role);

CREATE INDEX IF NOT EXISTS idx_users_org_created_by
    ON users (organization_id, created_by);

CREATE INDEX IF NOT EXISTS idx_users_org_created_at
    ON users (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_org_manager_id
    ON users (organization_id, manager_id)
    WHERE manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_org_must_reset
    ON users (organization_id, id)
    WHERE must_reset_password = TRUE;

CREATE INDEX IF NOT EXISTS idx_users_org_active_verified
    ON users (organization_id, is_active, is_verified)
    WHERE is_active = TRUE AND is_verified = TRUE;

-- ── STEP 4: TRIGGER ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_timestamp ON users;
CREATE TRIGGER trigger_update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_timestamp();

-- ── STEP 5: CREATE USER FUNCTION ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_with_role(
    p_organization_id UUID,
    p_email           VARCHAR,
    p_password_hash   VARCHAR,
    p_name            VARCHAR,
    p_role            VARCHAR    DEFAULT NULL,
    p_company_name    VARCHAR    DEFAULT NULL,
    p_created_by      UUID       DEFAULT NULL,
    p_auth_provider   VARCHAR    DEFAULT 'credentials',
    p_provider_id     TEXT       DEFAULT NULL,
    p_ip_address      INET       DEFAULT NULL,
    p_user_agent      TEXT       DEFAULT NULL
)
RETURNS TABLE(user_id UUID, otp VARCHAR) AS $$
DECLARE
    v_user_id      UUID;
    v_creator_role VARCHAR;
    v_otp          VARCHAR(6);
    v_expires_at   TIMESTAMPTZ;
    v_admin_count  INT;
BEGIN
    -- Count admins within THIS organization only
    SELECT COUNT(*) INTO v_admin_count
    FROM users
    WHERE organization_id = p_organization_id
      AND role = 'admin';

    IF p_role IS NULL THEN
        IF v_admin_count = 0 THEN
            p_role := 'admin';
        ELSE
            RAISE EXCEPTION 'Role must be provided after first admin';
        END IF;
    END IF;

    IF p_role NOT IN ('admin', 'manager', 'scales_man') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    -- Only one admin per org
    IF p_role = 'admin' AND v_admin_count > 0 THEN
        RAISE EXCEPTION 'Only one admin allowed per organization';
    END IF;

    v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    IF p_created_by IS NOT NULL THEN
        -- Verify creator belongs to the same org
        SELECT role INTO STRICT v_creator_role
        FROM users
        WHERE id = p_created_by
          AND organization_id = p_organization_id;

        IF p_role = 'admin' AND v_creator_role != 'admin' THEN
            RAISE EXCEPTION 'Only admin can create admin';
        END IF;
        IF p_role = 'manager' AND v_creator_role != 'admin' THEN
            RAISE EXCEPTION 'Only admin can create manager';
        END IF;
        IF p_role = 'scales_man' AND v_creator_role NOT IN ('admin', 'manager') THEN
            RAISE EXCEPTION 'Invalid permission';
        END IF;

        v_expires_at := CASE
            WHEN v_creator_role = 'admin' THEN NOW() + INTERVAL '24 hours'
            ELSE NOW() + INTERVAL '10 minutes'
        END;
    ELSE
        -- Self-registration: only allowed for the first admin of an org
        IF p_role != 'admin' THEN
            RAISE EXCEPTION 'First user must be admin';
        END IF;
        v_expires_at := NOW() + INTERVAL '10 minutes';
    END IF;

    INSERT INTO users (
        organization_id,
        email,
        auth_provider,
        password_hash,
        provider_id,
        name,
        role,
        company_name,
        created_by,
        email_otp,
        email_otp_expires_at,
        must_reset_password
    )
    VALUES (
        p_organization_id,
        p_email,
        p_auth_provider,
        p_password_hash,
        p_provider_id,
        p_name,
        p_role,
        p_company_name,
        p_created_by,
        v_otp,
        v_expires_at,
        CASE WHEN p_role IN ('manager', 'scales_man') THEN TRUE ELSE FALSE END
    )
    RETURNING id INTO v_user_id;

    IF p_role IN ('manager', 'scales_man') THEN
        INSERT INTO user_activities (
            organization_id,
            user_id,
            performed_by,
            activity_type,
            description,
            entity_type,
            entity_id,
            ip_address,
            user_agent
        )
        VALUES (
            p_organization_id,
            v_user_id,
            p_created_by,
            'user_created',
            CONCAT(p_role, ' created: ', p_name, ' (', p_email, ')'),
            'user',
            v_user_id,
            p_ip_address,
            p_user_agent
        );
    END IF;

    RETURN QUERY SELECT v_user_id, v_otp;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Email already exists in this organization: %', p_email;
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Creator not found in this organization';
END;
$$ LANGUAGE plpgsql;

-- ── STEP 6: VIEW ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW user_hierarchy AS
SELECT
    u.id,
    u.organization_id,
    u.email,
    u.name,
    u.role,
    u.company_name,
    u.is_active,
    u.is_verified,
    u.created_by,
    u.manager_id,

    c.email AS created_by_email,
    c.name  AS created_by_name,
    c.role  AS created_by_role,

    m.name  AS manager_name,

    u.last_login_at,
    u.login_count,
    u.created_at
FROM users u
LEFT JOIN users c ON u.created_by = c.id
LEFT JOIN users m ON u.manager_id = m.id
ORDER BY
    CASE u.role
        WHEN 'admin'      THEN 1
        WHEN 'manager'    THEN 2
        WHEN 'scales_man' THEN 3
    END,
    u.created_at DESC;