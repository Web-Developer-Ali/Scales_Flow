import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { pool } from "@/lib/db";
import { DatabaseUser, UserRole } from "@/types/next-auth";

// ===== Security Settings =====
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_EXPIRE_HOURS = 24;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: SESSION_EXPIRE_HOURS * 60 * 60,
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        try {
          // Query with lock check built-in
          const { rows } = await pool.query<DatabaseUser>(
            `
            SELECT *
            FROM users
            WHERE LOWER(email) = LOWER($1)
              AND (
                failed_login_attempts < $2 
                OR last_failed_login_at IS NULL
                OR last_failed_login_at < NOW() - INTERVAL '${LOCK_MINUTES} minutes'
              )
            LIMIT 1
            `,
            [email, MAX_FAILED_ATTEMPTS]
          );

          const user = rows[0];

          if (!user) {
            // Generic error - don't reveal if user exists or is locked
            throw new Error("Invalid credentials");
          }

          // Check account status
          if (!user.is_active || !user.is_verified) {
            throw new Error("Invalid credentials");
          }

          // Validate password
          const isValid = await compare(password, user.password_hash);

          if (!isValid) {
            await pool.query(
              `
              UPDATE users
              SET failed_login_attempts = failed_login_attempts + 1,
                  last_failed_login_at = NOW()
              WHERE id = $1
              `,
              [user.id]
            );

            throw new Error("Invalid credentials");
          }

          // Reset failed attempts on success
          await pool.query(
            `
            UPDATE users
            SET failed_login_attempts = 0,
                last_failed_login_at = NULL,
                last_login_at = NOW(),
                login_count = COALESCE(login_count, 0) + 1
            WHERE id = $1
            `,
            [user.id]
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyName: user.company_name,
            is_verified: user.is_verified,
            is_active: user.is_active,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyName = user.companyName ?? null;
        token.email = user.email;
        token.name = user.name;
        token.is_verified = user.is_verified;
        token.is_active = user.is_active;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        role: token.role as UserRole,
        companyName: (token.companyName as string) ?? null,
        email: token.email as string,
        name: token.name as string,
        is_active: token.is_active as boolean,
        is_verified: token.is_verified as boolean,
      };
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },

  events: {
    async signIn() {},
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
