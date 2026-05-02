import { NextResponse } from 'next/server';
import { eq, isNull, and, isNotNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { messages, users } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

// Returns { [offerId]: unreadCount } for all unread messages sent to the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select({ offerId: messages.offerId })
    .from(messages)
    .where(and(eq(messages.toUserId, myId), isNull(messages.readAt), isNotNull(messages.offerId)));

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.offerId] = (counts[row.offerId] ?? 0) + 1;
  }

  return NextResponse.json(counts);
}
