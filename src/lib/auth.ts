import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
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
