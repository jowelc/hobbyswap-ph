import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;

  await db.delete(notifications).where(
    and(eq(notifications.id, id), eq(notifications.userId, myId))
  );

  return NextResponse.json({ ok: true });
}
