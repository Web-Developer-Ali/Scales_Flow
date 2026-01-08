import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

/* ============================================================
   NEXT-AUTH SESSION TYPES
   ============================================================ */

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "admin" | "manager" | "scales_man";
      companyName?: string | null;
      email?: string | null;
      name?: string | null;
    };
  }

  interface User {
    id: string;
    role: "admin" | "manager" | "scales_man";
    companyName?: string | null;
    email: string;
    name: string;
  }
}

/* ============================================================
   NEXT-AUTH JWT TYPES
   ============================================================ */

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "admin" | "manager" | "scales_man";
    companyName?: string | null;
  }
}
