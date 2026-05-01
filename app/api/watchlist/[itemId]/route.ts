import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { watchlist, users } from '@/db/schema';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await params;
  const [me] = await db.select({ id: users.id }).from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db.delete(watchlist).where(and(eq(watchlist.userId, me.id), eq(watchlist.itemId, itemId)));
  return NextResponse.json({ ok: true });
}
