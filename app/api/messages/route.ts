import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { messages, users } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

// GET /api/messages?offerId=X — fetch conversation for a trade offer + mark incoming as read
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const offerId = req.nextUrl.searchParams.get('offerId');
  if (!offerId) return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Mark unread messages in this offer thread that were sent to me as read
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(
      eq(messages.offerId, offerId),
      eq(messages.toUserId, myId),
      isNull(messages.readAt),
    ));

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.offerId, offerId))
    .orderBy(messages.createdAt);

  return NextResponse.json(rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { offerId, toUserId, text, imageUrl } = await req.json();
  if (!offerId || !toUserId || (!text?.trim() && !imageUrl)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(messages)
    .values({ offerId, fromUserId: myId, toUserId, text: text?.trim() ?? '', imageUrl: imageUrl ?? null })
    .returning();

  return NextResponse.json({ ...inserted, createdAt: inserted.createdAt.toISOString() }, { status: 201 });
}
