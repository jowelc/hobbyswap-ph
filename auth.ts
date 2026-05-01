import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { eq } from 'drizzle-orm';
import { SUPERADMIN_EMAIL, isAdmin } from '@/lib/constants';
import { isWhitelisted } from '@/lib/auth-utils';
import { db } from '@/db';
import { users } from '@/db/schema';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? '';
      if (!await isWhitelisted(email)) {
        return `/access-denied?email=${encodeURIComponent(email)}`;
      }
      return true;
    },

    async jwt({ token, user }) {
      // user is only present on initial sign-in
      if (user?.email) {
        try {
          const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing.length) {
            await db
              .update(users)
              .set({ lastLoginAt: new Date(), isActive: true, isWhitelisted: await isWhitelisted(user.email) })
              .where(eq(users.email, user.email));
            token.userId = existing[0].id;
          } else {
            const base     = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            const username = `${base}${Date.now().toString(36).slice(-4)}`;

            const [inserted] = await db
              .insert(users)
              .values({
                email:         user.email,
                username,
                displayName:   user.name ?? '',
                avatarUrl:     user.image ?? '',
                isWhitelisted: await isWhitelisted(user.email),
                isActive:      true,
                lastLoginAt:   new Date(),
              })
              .returning({ id: users.id });

            token.userId = inserted.id;
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[auth] DB upsert failed:', err);
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        (session.user as typeof session.user & { id: string }).id = token.userId as string;
      }
      return session;
    },

    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;

      if (pathname.startsWith('/admin')) {
        if (!session) return false;
        if (!isAdmin(session.user?.email)) {
          return Response.redirect(new URL('/', request.nextUrl));
        }
      }

      if (pathname.startsWith('/profile')) {
        if (!session) return false;
      }

      return true;
    },
  },
});
