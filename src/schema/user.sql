-- ================================
-- EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================
-- USERS TABLE
-- ================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- AUTH
    email CITEXT NOT NULL UNIQUE,
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

    -- ACCOUNT STATUS
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- TIMESTAMPS
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ================================
    -- CONSTRAINTS
    -- ================================

    -- Role validation
    CONSTRAINT users_role_check CHECK (
        role IN ('admin', 'manager', 'scales_man')
    ),

    -- Auth validation (CRITICAL)
    CONSTRAINT users_auth_check CHECK (
        (auth_provider = 'credentials' AND password_hash IS NOT NULL)
        OR
        (auth_provider IN ('google', 'github'))
    ),

    -- Prevent empty email
    CONSTRAINT users_email_not_empty CHECK (email <> '')
);


-- ================================
-- INDEXES
-- ================================

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_created_by ON users (created_by);
CREATE INDEX idx_users_created_at ON users (created_at);


-- ================================
-- TRIGGER: AUTO UPDATE TIMESTAMP
-- ================================

CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_timestamp();


-- ================================
-- CREATE USER FUNCTION
-- ================================

CREATE OR REPLACE FUNCTION create_user_with_role(
    p_email VARCHAR,
    p_password_hash VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR DEFAULT NULL,
    p_company_name VARCHAR DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_auth_provider VARCHAR DEFAULT 'credentials',
    p_provider_id TEXT DEFAULT NULL
)
RETURNS TABLE(user_id UUID, otp VARCHAR) AS $$
DECLARE
    v_user_id UUID;
    v_creator_role VARCHAR;
    v_otp VARCHAR(6);
    v_expires_at TIMESTAMPTZ;
    v_admin_count INT;
BEGIN
    -- Count admins
    SELECT COUNT(*) INTO v_admin_count FROM users WHERE role = 'admin';

    -- Role logic
    IF p_role IS NULL THEN
        IF v_admin_count = 0 THEN
            p_role := 'admin';
        ELSE
            RAISE EXCEPTION 'Role must be provided after first admin';
        END IF;
    END IF;

    IF p_role NOT IN ('admin', 'manager', 'scales_man') THEN
        RAISE EXCEPTION 'Invalid role';
    END IF;

    IF p_role = 'admin' AND v_admin_count > 0 THEN
        RAISE EXCEPTION 'Only one admin allowed';
    END IF;

    -- OTP
    v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Creator permission logic
    IF p_created_by IS NOT NULL THEN
        SELECT role INTO STRICT v_creator_role
        FROM users
        WHERE id = p_created_by;

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
        IF p_role != 'admin' THEN
            RAISE EXCEPTION 'First user must be admin';
        END IF;

        v_expires_at := NOW() + INTERVAL '10 minutes';
    END IF;

    -- Insert user
    INSERT INTO users (
        email,
        auth_provider,
        password_hash,
        provider_id,
        name,
        role,
        company_name,
        created_by,
        email_otp,
        email_otp_expires_at
    )
    VALUES (
        p_email,
        p_auth_provider,
        p_password_hash,
        p_provider_id,
        p_name,
        p_role,
        p_company_name,
        p_created_by,
        v_otp,
        v_expires_at
    )
    RETURNING id INTO v_user_id;

    RETURN QUERY SELECT v_user_id, v_otp;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Email already exists';
END;
$$ LANGUAGE plpgsql;


-- ================================
-- VIEW
-- ================================

CREATE VIEW user_hierarchy AS
SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    u.company_name,
    u.created_by,

    c.email AS created_by_email,
    c.name AS created_by_name,
    c.role AS created_by_role,

    u.last_login_at,
    u.created_at
FROM users u
LEFT JOIN users c ON u.created_by = c.id
ORDER BY
    CASE u.role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'scales_man' THEN 3
    END,
    u.created_at DESC;