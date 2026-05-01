import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { tradeOffers, users } from '@/db/schema';

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
    .select({
      id:               tradeOffers.id,
      offeredItemIds:   tradeOffers.offeredItemIds,
      requestedItemIds: tradeOffers.requestedItemIds,
      cashDiff:         tradeOffers.cashDiff,
      message:          tradeOffers.message,
      status:           tradeOffers.status,
      readAt:           tradeOffers.readAt,
      createdAt:        tradeOffers.createdAt,
      fromUsername:     users.username,
      fromDisplayName:  users.displayName,
      fromAvatar:       users.avatarUrl,
    })
    .from(tradeOffers)
    .innerJoin(users, eq(tradeOffers.fromUserId, users.id))
    .where(eq(tradeOffers.toUserId, myId))
    .orderBy(desc(tradeOffers.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      offeredCount:   r.offeredItemIds.length,
      requestedCount: r.requestedItemIds.length,
      readAt:         r.readAt?.toISOString()  ?? null,
      createdAt:      r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { toUserId, offeredItemIds, requestedItemIds, cashDiff, message } = await req.json();
  if (!toUserId || !Array.isArray(offeredItemIds) || offeredItemIds.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(tradeOffers)
    .values({
      fromUserId:       myId,
      toUserId,
      offeredItemIds,
      requestedItemIds: requestedItemIds ?? [],
      cashDiff:         Number(cashDiff) || 0,
      message:          message?.trim() ?? '',
    })
    .returning();

  return NextResponse.json(
    { ...inserted, createdAt: inserted.createdAt.toISOString() },
    { status: 201 }
  );
}
