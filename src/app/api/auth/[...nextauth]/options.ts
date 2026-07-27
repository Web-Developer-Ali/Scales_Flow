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
        // The login form must now also submit the org slug.
        // This is either:
        //   (a) read from the URL: yourcrm.com/login?org=acme-agency
        //   (b) typed by the user in a "Workspace" field on the login form
        // Either way it arrives here as a credential.
        orgSlug: { label: "Workspace", type: "text" },
      },

      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;
        const orgSlug = credentials.orgSlug?.toString().trim().toLowerCase();

        try {
          const queryText = `
            SELECT
              u.*,
              o.id AS organization_id,
              o.slug AS org_slug,
              o.is_active AS org_is_active,
              o.plan AS org_plan
            FROM users u
            JOIN organizations o ON o.id = u.organization_id
            WHERE LOWER(u.email) = LOWER($1)
              ${orgSlug ? "AND o.slug = $2" : ""}
              AND (
                u.failed_login_attempts < $${orgSlug ? 3 : 2}
                OR u.last_failed_login_at IS NULL
                OR u.last_failed_login_at < NOW() - INTERVAL '${LOCK_MINUTES} minutes'
              )
            LIMIT 2
          `;

          const params = orgSlug
            ? [email, orgSlug, MAX_FAILED_ATTEMPTS]
            : [email, MAX_FAILED_ATTEMPTS];

          const { rows } = await pool.query<
            DatabaseUser & {
              organization_id: string;
              org_slug: string;
              org_is_active: boolean;
              org_plan: string;
            }
          >(queryText, params);

          const matches = rows as Array<
            DatabaseUser & {
              organization_id: string;
              org_slug: string;
              org_is_active: boolean;
              org_plan: string;
            }
          >;

          if (!matches.length) {
            throw new Error("Invalid credentials");
          }

          if (!orgSlug && matches.length > 1) {
            throw new Error("Workspace required");
          }

          const user = matches[0];

          if (!user.org_is_active) {
            throw new Error("Invalid credentials");
          }

          if (!user.is_active || !user.is_verified) {
            throw new Error("Invalid credentials");
          }

          const isValid = await compare(password, user.password_hash);

          if (!isValid) {
            await pool.query(
              `
              UPDATE users
              SET failed_login_attempts = failed_login_attempts + 1,
                  last_failed_login_at  = NOW()
              WHERE id = $1
              `,
              [user.id],
            );
            throw new Error("Invalid credentials");
          }

          await pool.query(
            `
            UPDATE users
            SET failed_login_attempts = 0,
                last_failed_login_at  = NULL,
                last_login_at         = NOW(),
                login_count           = COALESCE(login_count, 0) + 1
            WHERE id = $1
            `,
            [user.id],
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyName: user.company_name,
            organizationId: user.organization_id,
            orgPlan: user.org_plan,
            is_verified: user.is_verified,
            is_active: user.is_active,
            must_reset_password: user.must_reset_password,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error(
            error instanceof Error && error.message === "Workspace required"
              ? "Workspace required"
              : "Invalid credentials",
          );
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId; // ← new
        token.orgPlan = user.orgPlan; // ← new
        token.is_verified = user.is_verified;
        token.is_active = user.is_active;
        token.must_reset_password = user.must_reset_password;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string; // ← new
        session.user.orgPlan = token.orgPlan as string; // ← new
        session.user.is_verified = token.is_verified as boolean;
        session.user.is_active = token.is_active as boolean;
        session.user.must_reset_password = token.must_reset_password as boolean;
      }
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
