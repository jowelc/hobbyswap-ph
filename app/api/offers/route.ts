import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { tradeOffers, users } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const direction = req.nextUrl.searchParams.get('direction') ?? 'received';

  // Sent — pending offers I sent (receiver hasn't responded yet)
  if (direction === 'sent') {
    const rows = await db
      .select({
        id:               tradeOffers.id,
        toUserId:         tradeOffers.toUserId,
        offeredItemIds:   tradeOffers.offeredItemIds,
        requestedItemIds: tradeOffers.requestedItemIds,
        cashDiff:         tradeOffers.cashDiff,
        message:          tradeOffers.message,
        status:           tradeOffers.status,
        createdAt:        tradeOffers.createdAt,
        toUsername:       users.username,
        toDisplayName:    users.displayName,
        toAvatar:         users.avatarUrl,
      })
      .from(tradeOffers)
      .innerJoin(users, eq(tradeOffers.toUserId, users.id))
      .where(and(
        eq(tradeOffers.fromUserId, myId),
        eq(tradeOffers.status, 'pending'),
      ))
      .orderBy(desc(tradeOffers.createdAt));

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        offeredCount:   r.offeredItemIds.length,
        requestedCount: r.requestedItemIds.length,
        createdAt:      r.createdAt.toISOString(),
      }))
    );
  }

  // Accepted — both users see trades with status 'accepted'
  if (direction === 'accepted') {
    const rows = await db
      .select({
        id:               tradeOffers.id,
        fromUserId:       tradeOffers.fromUserId,
        toUserId:         tradeOffers.toUserId,
        offeredItemIds:   tradeOffers.offeredItemIds,
        requestedItemIds: tradeOffers.requestedItemIds,
        cashDiff:         tradeOffers.cashDiff,
        message:          tradeOffers.message,
        fromShipped:      tradeOffers.fromShipped,
        toShipped:        tradeOffers.toShipped,
        fromReceived:     tradeOffers.fromReceived,
        toReceived:       tradeOffers.toReceived,
        cashSettled:      tradeOffers.cashSettled,
        fromDoneDeal:     tradeOffers.fromDoneDeal,
        toDoneDeal:       tradeOffers.toDoneDeal,
        createdAt:        tradeOffers.createdAt,
        fromUsername:     users.username,
        fromDisplayName:  users.displayName,
        fromAvatar:       users.avatarUrl,
        fromTier:         users.tier,
      })
      .from(tradeOffers)
      .innerJoin(users, eq(tradeOffers.fromUserId, users.id))
      .where(and(
        eq(tradeOffers.status, 'accepted'),
        or(eq(tradeOffers.fromUserId, myId), eq(tradeOffers.toUserId, myId)),
      ))
      .orderBy(desc(tradeOffers.createdAt));

    const toUserIds = [...new Set(rows.map((r) => r.toUserId))];
    const toUsers = toUserIds.length > 0
      ? await db
          .select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, tier: users.tier })
          .from(users)
          .where(inArray(users.id, toUserIds))
      : [];
    const toUserMap = new Map(toUsers.map((u) => [u.id, u]));

    return NextResponse.json(
      rows.map((r) => {
        const toUser = toUserMap.get(r.toUserId);
        return {
          ...r,
          toUsername:    toUser?.username    ?? '',
          toDisplayName: toUser?.displayName ?? '',
          toAvatar:      toUser?.avatarUrl   ?? '',
          toTier:        toUser?.tier        ?? 'verified',
          iAmSender:     r.fromUserId === myId,
          offeredCount:  r.offeredItemIds.length,
          requestedCount: r.requestedItemIds.length,
          createdAt:     r.createdAt.toISOString(),
        };
      })
    );
  }

  // Archived — both users see declined + completed trades
  if (direction === 'archived') {
    const rows = await db
      .select({
        id:               tradeOffers.id,
        fromUserId:       tradeOffers.fromUserId,
        toUserId:         tradeOffers.toUserId,
        offeredItemIds:   tradeOffers.offeredItemIds,
        requestedItemIds: tradeOffers.requestedItemIds,
        cashDiff:         tradeOffers.cashDiff,
        status:           tradeOffers.status,
        createdAt:        tradeOffers.createdAt,
        fromUsername:     users.username,
        fromDisplayName:  users.displayName,
        fromAvatar:       users.avatarUrl,
      })
      .from(tradeOffers)
      .innerJoin(users, eq(tradeOffers.fromUserId, users.id))
      .where(and(
        or(eq(tradeOffers.status, 'declined'), eq(tradeOffers.status, 'completed')),
        or(eq(tradeOffers.fromUserId, myId), eq(tradeOffers.toUserId, myId)),
      ))
      .orderBy(desc(tradeOffers.createdAt));

    const toUserIds = [...new Set(rows.map((r) => r.toUserId))];
    const toUsers = toUserIds.length > 0
      ? await db
          .select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
          .from(users)
          .where(inArray(users.id, toUserIds))
      : [];
    const toUserMap = new Map(toUsers.map((u) => [u.id, u]));

    return NextResponse.json(
      rows.map((r) => {
        const toUser = toUserMap.get(r.toUserId);
        return {
          id:              r.id,
          fromUserId:      r.fromUserId,
          toUserId:        r.toUserId,
          fromUsername:    r.fromUsername,
          fromDisplayName: r.fromDisplayName,
          fromAvatar:      r.fromAvatar,
          toUsername:      toUser?.username    ?? '',
          toDisplayName:   toUser?.displayName ?? '',
          toAvatar:        toUser?.avatarUrl   ?? '',
          iAmSender:       r.fromUserId === myId,
          offeredCount:    r.offeredItemIds.length,
          requestedCount:  r.requestedItemIds.length,
          cashDiff:        r.cashDiff,
          status:          r.status,
          createdAt:       r.createdAt.toISOString(),
        };
      })
    );
  }

  // Received (default) — pending offers sent to me
  const rows = await db
    .select({
      id:               tradeOffers.id,
      fromUserId:       tradeOffers.fromUserId,
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
    .where(and(
      eq(tradeOffers.toUserId, myId),
      eq(tradeOffers.status, 'pending'),
    ))
    .orderBy(desc(tradeOffers.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      offeredCount:   r.offeredItemIds.length,
      requestedCount: r.requestedItemIds.length,
      readAt:         r.readAt?.toISOString() ?? null,
      createdAt:      r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { toUserId, offeredItemIds, requestedItemIds, cashDiff, message, replaceOfferId } = await req.json();
  const cashAmt = Number(cashDiff) || 0;
  if (!toUserId || !Array.isArray(offeredItemIds) || (offeredItemIds.length === 0 && cashAmt <= 0)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Delete the offer being countered (must be one where myId is the recipient)
  if (replaceOfferId) {
    await db.delete(tradeOffers).where(
      and(eq(tradeOffers.id, replaceOfferId), eq(tradeOffers.toUserId, myId))
    );
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
