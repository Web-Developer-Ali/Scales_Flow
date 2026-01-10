
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



--    USERS TABLE

CREATE TABLE users (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

   
    --    Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    --    Profile
   
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100),

    /* --------------------------------------------------------
       Roles & hierarchy
       -------------------------------------------------------- */
    role VARCHAR(20) NOT NULL DEFAULT 'scales_man',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    /* --------------------------------------------------------
       OTP: Email verification
       -------------------------------------------------------- */
    email_otp VARCHAR(6),
    email_otp_expires_at TIMESTAMP WITH TIME ZONE,

    /* --------------------------------------------------------
       OTP: Password reset
       -------------------------------------------------------- */
    reset_password_otp VARCHAR(6),
    reset_password_otp_expires_at TIMESTAMP WITH TIME ZONE,

    /* --------------------------------------------------------
       Authentication tracking
       -------------------------------------------------------- */
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login_at TIMESTAMP WITH TIME ZONE,

    /* --------------------------------------------------------
       Account status
       -------------------------------------------------------- */
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    /* --------------------------------------------------------
       Timestamps
       -------------------------------------------------------- */
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    /* --------------------------------------------------------
       Constraints
       -------------------------------------------------------- */
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'scales_man'))
);



/* ============================================================
   USERS INDEXES
   ============================================================ */

-- Case-insensitive email lookup
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- Role filtering
CREATE INDEX idx_users_role ON users (role);

-- Hierarchy lookups
CREATE INDEX idx_users_created_by ON users (created_by);

-- Sorting / pagination
CREATE INDEX idx_users_created_at ON users (created_at);


-- function to auto update user table 
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





/* ============================================================
   create user using db function
   ============================================================ */

CREATE OR REPLACE FUNCTION create_user_with_role(
    p_email VARCHAR,
    p_password_hash VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR DEFAULT NULL,
    p_company_name VARCHAR DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE(user_id UUID, otp VARCHAR) AS $$
DECLARE
    v_user_id UUID;
    v_creator_role VARCHAR;
    v_otp VARCHAR(6);
    v_expires_at TIMESTAMPTZ;
    v_admin_count INT;
BEGIN
    -- Count existing admins
    SELECT COUNT(*) INTO v_admin_count FROM users WHERE role = 'admin';

    -- Determine role
    IF p_role IS NULL THEN
        IF v_admin_count = 0 THEN
            p_role := 'admin'; -- first user becomes admin
        ELSE
            RAISE EXCEPTION 'Role must be provided when creating users after the first admin';
        END IF;
    END IF;

    -- Validate role
    IF p_role NOT IN ('admin', 'manager', 'scales_man') THEN
        RAISE EXCEPTION 'Invalid role';
    END IF;

    -- Prevent multiple admins
    IF p_role = 'admin' AND v_admin_count > 0 THEN
        RAISE EXCEPTION 'An admin already exists. Only one admin allowed';
    END IF;

    -- Generate 6-digit OTP
    v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Permission checks
    IF p_created_by IS NOT NULL THEN
        -- Get creator role
        SELECT role INTO v_creator_role FROM users WHERE id = p_created_by;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Creator user not found';
        END IF;

        -- Admin creation
        IF p_role = 'admin' AND v_creator_role != 'admin' THEN
            RAISE EXCEPTION 'Only admins can create admin users';
        END IF;

        -- Manager creation
        IF p_role = 'manager' AND v_creator_role != 'admin' THEN
            RAISE EXCEPTION 'Only admins can create manager users';
        END IF;

        -- Scales_man creation
        IF p_role = 'scales_man' AND v_creator_role NOT IN ('admin', 'manager') THEN
            RAISE EXCEPTION 'Only admins or managers can create scales_man users';
        END IF;

        -- Set OTP expiry
        IF v_creator_role = 'admin' THEN
            v_expires_at := NOW() + INTERVAL '24 hours';
        ELSE
            v_expires_at := NOW() + INTERVAL '10 minutes';
        END IF;

    ELSE
        -- Bootstrap first admin
        IF p_role != 'admin' THEN
            RAISE EXCEPTION 'Non-admin users must have a creator';
        END IF;
        v_expires_at := NOW() + INTERVAL '10 minutes';
    END IF;

    -- Insert user
    INSERT INTO users (
        email,
        password_hash,
        name,
        role,
        company_name,
        created_by,
        email_otp,
        email_otp_expires_at
    )
    VALUES (
        LOWER(p_email),
        p_password_hash,
        p_name,
        p_role,
        p_company_name,
        p_created_by,
        v_otp,
        v_expires_at
    )
    RETURNING id INTO v_user_id;

    -- Log activity
    INSERT INTO user_activities (
        user_id,
        activity_type,
        description
    )
    VALUES (v_user_id, 'account_created', 'User account created');

    -- Return user_id and OTP
    user_id := v_user_id;
    otp := v_otp;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;



/* ============================================================
   USER HIERARCHY VIEW
   ============================================================ */

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
