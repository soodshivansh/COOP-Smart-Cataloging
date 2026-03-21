import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isPasswordValid) return null;

        // If 2FA is enabled, verify the TOTP code
        if ((user as any).twoFactorEnabled && (user as any).twoFactorSecret) {
          const code = credentials.totpCode as string;
          if (!code) {
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              twoFactorEnabled: true,
              pendingTwoFactor: true,
            };
          }
          const totp = new OTPAuth.TOTP({ secret: (user as any).twoFactorSecret, digits: 6, period: 30 });
          const delta = totp.validate({ token: code, window: 1 });
          if (delta === null) return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          twoFactorEnabled: (user as any).twoFactorEnabled ?? false,
          pendingTwoFactor: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.pendingTwoFactor = user.pendingTwoFactor ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.pendingTwoFactor = token.pendingTwoFactor as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
});
