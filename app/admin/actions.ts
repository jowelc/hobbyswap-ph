'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { whitelist } from '@/db/schema';

type State = { error?: string; success?: boolean };

export async function addEmailToWhitelist(_prev: State, formData: FormData): Promise<State> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  try {
    const existing = await db
      .select({ id: whitelist.id })
      .from(whitelist)
      .where(eq(whitelist.email, email))
      .limit(1);

    if (existing.length) {
      return { error: 'This email is already in the whitelist.' };
    }

    await db.insert(whitelist).values({ email });
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Database error.' };
  }
}
