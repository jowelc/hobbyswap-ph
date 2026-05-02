import { NextRequest, NextResponse } from 'next/server';
import { eq, and, inArray, or } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { tradeOffers, users, items, notifications } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return user?.id ?? null;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [offer] = await db
    .select({
      id:               tradeOffers.id,
      fromUserId:       tradeOffers.fromUserId,
      toUserId:         tradeOffers.toUserId,
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
      eq(tradeOffers.id, id),
      or(eq(tradeOffers.toUserId, myId), eq(tradeOffers.fromUserId, myId)),
    ))
    .limit(1);

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [toUser] = await db
    .select({ username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, offer.toUserId))
    .limit(1);

  const allItemIds = [...new Set([...offer.offeredItemIds, ...offer.requestedItemIds])];
  const itemDetails = allItemIds.length > 0
    ? await db
        .select({ id: items.id, name: items.name, frontImageUrl: items.frontImageUrl, estimatedValue: items.estimatedValue, condition: items.condition })
        .from(items)
        .where(inArray(items.id, allItemIds))
    : [];

  const itemMap = new Map(itemDetails.map((i) => [i.id, i]));

  return NextResponse.json({
    ...offer,
    readAt:         offer.readAt?.toISOString() ?? null,
    createdAt:      offer.createdAt.toISOString(),
    toUsername:     toUser?.username    ?? '',
    toDisplayName:  toUser?.displayName ?? '',
    toAvatar:       toUser?.avatarUrl   ?? '',
    offeredItems:   offer.offeredItemIds.map((iid) => itemMap.get(iid) ?? { id: iid, name: 'Unknown item', frontImageUrl: '', estimatedValue: 0, condition: '' }),
    requestedItems: offer.requestedItemIds.map((iid) => itemMap.get(iid) ?? { id: iid, name: 'Unknown item', frontImageUrl: '', estimatedValue: 0, condition: '' }),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json() as { status?: string; action?: string; field?: string; value?: boolean };

  // ── Checklist update ──────────────────────────────────────────────────────────
  if (body.action === 'checklist') {
    const { field, value } = body;
    if (typeof value !== 'boolean') return NextResponse.json({ error: 'Invalid value' }, { status: 400 });

    const [offer] = await db
      .select({ fromUserId: tradeOffers.fromUserId, toUserId: tradeOffers.toUserId, status: tradeOffers.status })
      .from(tradeOffers)
      .where(and(
        eq(tradeOffers.id, id),
        or(eq(tradeOffers.fromUserId, myId), eq(tradeOffers.toUserId, myId)),
      ))
      .limit(1);

    if (!offer || offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Not found or not accepted' }, { status: 404 });
    }

    const iAmSender = offer.fromUserId === myId;
    let updateData: Partial<typeof tradeOffers.$inferInsert>;

    if (field === 'myShipped') {
      updateData = iAmSender ? { fromShipped: value } : { toShipped: value };
    } else if (field === 'myReceived') {
      updateData = iAmSender ? { fromReceived: value } : { toReceived: value };
    } else if (field === 'cashSettled') {
      updateData = { cashSettled: value };
    } else {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    await db.update(tradeOffers).set(updateData).where(eq(tradeOffers.id, id));
    return NextResponse.json({ ok: true });
  }

  // ── Done Deal — requires BOTH users to confirm ────────────────────────────────
  if (body.action === 'doneDeal') {
    const [offer] = await db
      .select({
        fromUserId:       tradeOffers.fromUserId,
        toUserId:         tradeOffers.toUserId,
        status:           tradeOffers.status,
        offeredItemIds:   tradeOffers.offeredItemIds,
        requestedItemIds: tradeOffers.requestedItemIds,
      })
      .from(tradeOffers)
      .where(and(
        eq(tradeOffers.id, id),
        or(eq(tradeOffers.fromUserId, myId), eq(tradeOffers.toUserId, myId)),
      ))
      .limit(1);

    if (!offer || offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Not found or not accepted' }, { status: 404 });
    }

    const iAmSender = offer.fromUserId === myId;

    // Atomic update + read — avoids stale-read races on serverless connection pools
    const [result] = await db.update(tradeOffers)
      .set(iAmSender ? { fromDoneDeal: true } : { toDoneDeal: true })
      .where(eq(tradeOffers.id, id))
      .returning({
        fromDoneDeal:     tradeOffers.fromDoneDeal,
        toDoneDeal:       tradeOffers.toDoneDeal,
        offeredItemIds:   tradeOffers.offeredItemIds,
        requestedItemIds: tradeOffers.requestedItemIds,
      });

    if (!result) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    // Both confirmed — complete the trade
    if (result.fromDoneDeal && result.toDoneDeal) {
      await db.update(tradeOffers).set({ status: 'completed' }).where(eq(tradeOffers.id, id));

      if (result.offeredItemIds.length > 0) {
        await db.update(items)
          .set({ userId: offer.toUserId, isForTrade: false })
          .where(inArray(items.id, result.offeredItemIds));
      }
      if (result.requestedItemIds.length > 0) {
        await db.update(items)
          .set({ userId: offer.fromUserId, isForTrade: false })
          .where(inArray(items.id, result.requestedItemIds));
      }

      const otherUserId = iAmSender ? offer.toUserId : offer.fromUserId;
      const [actor] = await db
        .select({ username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, myId))
        .limit(1);

      await db.insert(notifications).values({
        userId:           otherUserId,
        type:             'deal_done',
        actorUserId:      myId,
        actorUsername:    actor.username,
        actorDisplayName: actor.displayName,
        actorAvatar:      actor.avatarUrl,
        offerId:          id,
        body:             `@${actor.username} confirmed Done Deal — trade complete! 🤝`,
      });

      return NextResponse.json({ ok: true, completed: true });
    }

    return NextResponse.json({ ok: true, completed: false });
  }

  // ── Status update (accept / decline) ─────────────────────────────────────────
  const { status } = body;
  if (!status || !['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const [offerRow] = await db
    .select({ fromUserId: tradeOffers.fromUserId })
    .from(tradeOffers)
    .where(and(eq(tradeOffers.id, id), eq(tradeOffers.toUserId, myId)))
    .limit(1);

  if (!offerRow) return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });

  await db.update(tradeOffers).set({ status }).where(eq(tradeOffers.id, id));

  const [actor] = await db
    .select({ username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, myId))
    .limit(1);

  if (status === 'accepted') {
    await db.insert(notifications).values({
      userId:           offerRow.fromUserId,
      type:             'offer_accepted',
      actorUserId:      myId,
      actorUsername:    actor.username,
      actorDisplayName: actor.displayName,
      actorAvatar:      actor.avatarUrl,
      offerId:          id,
      body:             `@${actor.username} accepted your trade offer`,
    });
  } else {
    await db.insert(notifications).values({
      userId:           offerRow.fromUserId,
      type:             'offer_declined',
      actorUserId:      myId,
      actorUsername:    actor.username,
      actorDisplayName: actor.displayName,
      actorAvatar:      actor.avatarUrl,
      offerId:          id,
      body:             `@${actor.username} declined your trade offer`,
    });
  }

  return NextResponse.json({ ok: true, status });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const myId = await resolveUserId(session.user.email);
  if (!myId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [offer] = await db
    .select({
      id:         tradeOffers.id,
      fromUserId: tradeOffers.fromUserId,
      toUserId:   tradeOffers.toUserId,
      status:     tradeOffers.status,
    })
    .from(tradeOffers)
    .where(and(
      eq(tradeOffers.id, id),
      or(eq(tradeOffers.toUserId, myId), eq(tradeOffers.fromUserId, myId)),
    ))
    .limit(1);

  if (!offer) return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });

  const [actor] = await db
    .select({ username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, myId))
    .limit(1);

  await db.delete(tradeOffers).where(eq(tradeOffers.id, id));

  // Skip notification for already-archived offers (declined / completed) — no value in notifying
  if (offer.status === 'pending') {
    const isSender    = offer.fromUserId === myId;
    const otherUserId = isSender ? offer.toUserId : offer.fromUserId;
    const type        = isSender ? 'offer_retracted' : 'offer_deleted';
    const msgBody     = isSender
      ? `@${actor.username} retracted their trade offer`
      : `@${actor.username} removed a declined trade offer`;

    await db.insert(notifications).values({
      userId:           otherUserId,
      type,
      actorUserId:      myId,
      actorUsername:    actor.username,
      actorDisplayName: actor.displayName,
      actorAvatar:      actor.avatarUrl,
      offerId:          id,
      body:             msgBody,
    });
  }

  return NextResponse.json({ ok: true });
}
