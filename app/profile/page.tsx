import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/constants';
import { isWhitelisted } from '@/lib/auth-utils';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!email) redirect('/login');
  if (isAdmin(email)) redirect('/admin');
  if (!await isWhitelisted(email)) redirect(`/access-denied?email=${encodeURIComponent(email)}`);

  const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const tier = (dbUser?.tier === 'premium' ? 'premium' : 'verified') as 'verified' | 'premium';

  return (
    <ProfileClient
      email={email}
      name={session?.user?.name ?? dbUser?.displayName ?? email.split('@')[0]}
      image={session?.user?.image ?? null}
      username={dbUser?.username ?? email.split('@')[0]}
      displayName={dbUser?.displayName ?? session?.user?.name ?? email.split('@')[0]}
      tier={tier}
    />
  );
}
