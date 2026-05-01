import { NextRequest, NextResponse } from 'next/server';
import { eq, or, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { messages, users } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const withUserId = req.nextUrl.searchParams.get('withUserId');
  if (!withUserId) return NextResponse.json({ error: 'Missing withUserId' }, { status: 400 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.fromUserId, myId), eq(messages.toUserId, withUserId)),
        and(eq(messages.fromUserId, withUserId), eq(messages.toUserId, myId)),
      )
    )
    .orderBy(messages.createdAt);

  return NextResponse.json(rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { toUserId, text } = await req.json();
  if (!toUserId || !text?.trim()) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const [inserted] = await db
    .insert(messages)
    .values({ fromUserId: myId, toUserId, text: text.trim() })
    .returning();

  return NextResponse.json({ ...inserted, createdAt: inserted.createdAt.toISOString() }, { status: 201 });
}
