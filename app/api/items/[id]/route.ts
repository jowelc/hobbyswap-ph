import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { items, users, watchlist, notifications } from '@/db/schema';

async function resolveUserId(email: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user?.id ?? null;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...item, addedAt: item.addedAt.toISOString() });
}

async function notifyWatchers(
  itemId: string,
  actor: { id: string; username: string; displayName: string; avatarUrl: string },
  type: string,
  body: string,
) {
  const watchers = await db
    .select({ userId: watchlist.userId })
    .from(watchlist)
    .where(and(eq(watchlist.itemId, itemId)));

  const targets = watchers.map(w => w.userId).filter(uid => uid !== actor.id);
  if (targets.length === 0) return;

  await db.insert(notifications).values(
    targets.map(uid => ({
      userId:           uid,
      type,
      actorUserId:      actor.id,
      actorUsername:    actor.username,
      actorDisplayName: actor.displayName,
      actorAvatar:      actor.avatarUrl,
      offerId:          null,
      body,
    })),
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = await resolveUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();

  const [before] = await db.select().from(items).where(and(eq(items.id, id), eq(items.userId, userId))).limit(1);
  if (!before) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

  const [updated] = await db
    .update(items)
    .set({
      ...(body.name            !== undefined && { name: body.name }),
      ...(body.category        !== undefined && { category: body.category }),
      ...(body.condition       !== undefined && { condition: body.condition }),
      ...(body.estimatedValue  !== undefined && { estimatedValue: body.estimatedValue }),
      ...(body.tradePreference !== undefined && { tradePreference: body.tradePreference }),
      ...(body.frontImageUrl   !== undefined && { frontImageUrl: body.frontImageUrl }),
      ...(body.backImageUrl    !== undefined && { backImageUrl: body.backImageUrl }),
      ...(body.description     !== undefined && { description: body.description }),
      ...(body.lookingFor      !== undefined && { lookingFor: body.lookingFor }),
      ...(body.notes           !== undefined && { notes: body.notes }),
      ...(body.isForTrade      !== undefined && { isForTrade: body.isForTrade }),
      ...(body.tags            !== undefined && { tags: body.tags }),
    })
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

  const [actor] = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users).where(eq(users.id, userId)).limit(1);

  if (actor) {
    if (body.isForTrade === true && before.isForTrade === false) {
      await notifyWatchers(id, actor, 'watchlist_available',
        `"${before.name}" is now available for trade again.`);
    } else if (body.isForTrade === false && before.isForTrade === true) {
      await notifyWatchers(id, actor, 'watchlist_unavailable',
        `"${before.name}" is no longer available for trade.`);
    }
    if (body.estimatedValue !== undefined && body.estimatedValue !== before.estimatedValue) {
      await notifyWatchers(id, actor, 'watchlist_price_change',
        `"${before.name}" price updated to ₱${Number(body.estimatedValue).toLocaleString()}.`);
    }
  }

  return NextResponse.json({ ...updated, addedAt: updated.addedAt.toISOString() });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = await resolveUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [item] = await db.select().from(items).where(and(eq(items.id, id), eq(items.userId, userId))).limit(1);
  if (!item) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

  const [actor] = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users).where(eq(users.id, userId)).limit(1);

  if (actor) {
    await notifyWatchers(id, actor, 'watchlist_deleted',
      `"${item.name}" has been removed from the marketplace.`);
  }

  await db.delete(items).where(and(eq(items.id, id), eq(items.userId, userId)));
  return new NextResponse(null, { status: 204 });
}
