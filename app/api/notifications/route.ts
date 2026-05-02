import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, myId))
    .orderBy(desc(notifications.createdAt));

  return NextResponse.json(
    rows.map((n) => ({
      ...n,
      readAt:    n.readAt?.toISOString()    ?? null,
      createdAt: n.createdAt.toISOString(),
    }))
  );
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.userId, myId));

  return NextResponse.json({ ok: true });
}
