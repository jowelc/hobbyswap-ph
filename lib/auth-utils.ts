import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { whitelist } from '@/db/schema';
import { SUPERADMIN_EMAIL } from './constants';

export async function isWhitelisted(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (email === SUPERADMIN_EMAIL) return true;

  const [row] = await db
    .select({ id: whitelist.id })
    .from(whitelist)
    .where(eq(whitelist.email, email.toLowerCase()))
    .limit(1);

  return Boolean(row);
}
