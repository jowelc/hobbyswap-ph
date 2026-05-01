import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { tradeOffers, users } from '@/db/schema';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db
    .update(tradeOffers)
    .set({ readAt: new Date() })
    .where(and(eq(tradeOffers.toUserId, user.id), isNull(tradeOffers.readAt)));

  return NextResponse.json({ ok: true });
}
