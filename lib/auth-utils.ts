import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { whitelist, users } from '@/db/schema';
import { SUPERADMIN_EMAIL } from './constants';

export async function isWhitelisted(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (normalized === SUPERADMIN_EMAIL.toLowerCase()) return true;

  const [whitelistRow] = await db
    .select({ id: whitelist.id })
    .from(whitelist)
    .where(eq(whitelist.email, normalized))
    .limit(1);

  if (whitelistRow) return true;

  // Fallback: a registered user whose isWhitelisted flag is still true is allowed in.
  // This handles cases where the whitelist table entry is missing but the user was
  // previously approved (whitelist table and users table can drift if data is manipulated).
  const [userRow] = await db
    .select({ isWhitelisted: users.isWhitelisted })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  return userRow?.isWhitelisted === true;
}
