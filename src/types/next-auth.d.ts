import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

/* ============================================================
   USER ROLE TYPE
   ============================================================ */

export type UserRole = "admin" | "manager" | "scales_man";

/* ============================================================
   DATABASE USER INTERFACE
   ============================================================ */

export interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  company_name: string | null;
  is_active: boolean;
  is_verified: boolean;
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
      is_active?: boolean;
      is_verified?: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    companyName?: string | null;
    email: string;
    name: string;
    is_verified?: boolean;
    is_active?: boolean;
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
    is_verified?: boolean;
    is_active?: boolean;
  }
}
