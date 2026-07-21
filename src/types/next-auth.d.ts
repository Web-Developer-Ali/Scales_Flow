// types/next-auth.ts

export type UserRole = "admin" | "manager" | "scales_man";

// ← Added export keyword + organization_id + org_plan
export interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  company_name: string | null;
  organization_id: string; // ← new
  org_plan: string; // ← new
  org_is_active: boolean; // ← new (from the JOIN in authOptions)
  is_active: boolean;
  is_verified: boolean;
  must_reset_password: boolean;
  failed_login_attempts: number;
  last_failed_login_at: Date | null;
}

/* ============================================================
   NEXT-AUTH SESSION TYPES
   ============================================================ */

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      companyName?: string | null;
      email?: string | null;
      name?: string | null;
      organizationId: string; // ← new
      orgPlan: string; // ← new
      is_active?: boolean;
      is_verified?: boolean;
      must_reset_password: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    companyName?: string | null;
    email: string;
    name: string;
    organizationId: string; // ← new
    orgPlan: string; // ← new
    is_verified?: boolean;
    is_active?: boolean;
    must_reset_password?: boolean;
  }
}

/* ============================================================
   NEXT-AUTH JWT TYPES
   ============================================================ */

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    companyName?: string | null;
    organizationId: string; // ← new
    orgPlan: string; // ← new
    is_verified?: boolean;
    is_active?: boolean;
    must_reset_password?: boolean;
  }
}
