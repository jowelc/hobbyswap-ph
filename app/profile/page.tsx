import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isAdmin, isWhitelisted, WHITELISTED_USERS } from '@/lib/constants';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!email) redirect('/login');
  if (isAdmin(email)) redirect('/admin');
  if (!isWhitelisted(email)) redirect(`/access-denied?email=${encodeURIComponent(email)}`);

  const userInfo = WHITELISTED_USERS[email] ?? {
    username: email.split('@')[0],
    displayName: session?.user?.name ?? email.split('@')[0],
  };

  return (
    <ProfileClient
      email={email}
      name={session?.user?.name ?? userInfo.displayName}
      image={session?.user?.image ?? null}
      username={userInfo.username}
      displayName={userInfo.displayName}
    />
  );
}
