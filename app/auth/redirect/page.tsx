import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/constants';
import { isWhitelisted } from '@/lib/auth-utils';

// Server component — runs after every OAuth callback, routes to the right destination.
export default async function AuthRedirectPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!email || !await isWhitelisted(email)) {
    redirect(`/access-denied${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  }

  if (isAdmin(email)) {
    redirect('/admin');
  }

  // Regular whitelisted user
  redirect('/profile');
}
