'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { whitelist, users, items, notifications } from '@/db/schema';

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

export async function setUserTier(_prev: State, formData: FormData): Promise<State> {
  const userId = ((formData.get('userId') as string) ?? '').trim();
  const tier   = ((formData.get('tier')   as string) ?? '').trim();

  if (!userId || !['verified', 'premium'].includes(tier)) {
    return { error: 'Invalid request.' };
  }

  try {
    await db.update(users).set({ tier }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Database error.' };
  }
}

export async function deleteUser(_prev: State, formData: FormData): Promise<State> {
  const userId = ((formData.get('userId') as string) ?? '').trim();
  if (!userId) return { error: 'User ID required.' };

  try {
    const [user] = await db.select({ isWhitelisted: users.isWhitelisted }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return { error: 'User not found.' };
    if (user.isWhitelisted) return { error: 'Cannot delete a whitelisted user.' };

    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Database error.' };
  }
}

export async function deleteAdminItem(_prev: State, formData: FormData): Promise<State> {
  const itemId = ((formData.get('itemId') as string) ?? '').trim();
  if (!itemId) return { error: 'Item ID required.' };

  try {
    await db.delete(items).where(eq(items.id, itemId));
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Database error.' };
  }
}

export async function deleteNotification(_prev: State, formData: FormData): Promise<State> {
  const notifId = ((formData.get('notifId') as string) ?? '').trim();
  if (!notifId) return { error: 'Notification ID required.' };

  try {
    await db.delete(notifications).where(eq(notifications.id, notifId));
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Database error.' };
  }
}

export async function removeFromWhitelist(_prev: State, formData: FormData): Promise<State> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase();
  if (!email) return { error: 'Email required.' };

  try {
    await db.delete(whitelist).where(eq(whitelist.email, email));
    await db.update(users).set({ isWhitelisted: false }).where(eq(users.email, email));
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Database error.' };
  }
}
