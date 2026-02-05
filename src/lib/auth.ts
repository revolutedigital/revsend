import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";
import { getEffectiveRole } from "./permissions";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            organizations: {
              include: {
                organization: true,
              },
              orderBy: {
                createdAt: "asc",
              },
              take: 1, // Get first (default) organization
            },
          },
        });

        if (!user) {
          return null;
        }

        // Account lockout check
        if (
          user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS &&
          user.lastFailedLogin &&
          Date.now() - user.lastFailedLogin.getTime() < LOCKOUT_DURATION_MS
        ) {
          throw new Error("Account locked. Try again in 15 minutes.");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lastFailedLogin: new Date(),
            },
          });
          return null;
        }

        // Reset failed attempts on successful login
        if (user.failedLoginAttempts > 0) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lastFailedLogin: null },
          });
        }

        // Get first organization membership (default org)
        const firstMembership = user.organizations[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isMaster: user.isMaster,
          // Include org info for JWT callback
          currentOrgId: firstMembership?.organizationId || null,
          currentOrgRole: firstMembership?.role || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id!;
        token.isMaster = user.isMaster!
        token.currentOrgId = (user as any).currentOrgId || null;
        token.currentOrgRole = (user as any).currentOrgRole || null;
      }

      // Handle session update (e.g., org switch)
      if (trigger === "update" && session) {
        // Validate that user has access to the new org
        if (session.currentOrgId) {
          const membership = await db.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: session.currentOrgId,
                userId: token.id,
              },
            },
          });

          // Master can switch to any org
          if (membership || token.isMaster) {
            token.currentOrgId = session.currentOrgId;
            token.currentOrgRole = membership?.role || null;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isMaster = token.isMaster;
        session.user.currentOrgId = token.currentOrgId;
        session.user.currentOrgRole = token.currentOrgRole;

        // Compute effective role
        session.user.role = getEffectiveRole(
          token.isMaster,
          token.currentOrgRole
        );
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Refresh token every hour
  },
  trustHost: true,
});
