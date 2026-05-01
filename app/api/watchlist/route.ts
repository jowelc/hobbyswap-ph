import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { watchlist, items, users } from '@/db/schema';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [me] = await db.select({ id: users.id }).from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select({
      itemId:         items.id,
      name:           items.name,
      category:       items.category,
      condition:      items.condition,
      estimatedValue: items.estimatedValue,
      frontImageUrl:  items.frontImageUrl,
      isForTrade:     items.isForTrade,
      location:       items.location,
      ownerUsername:  users.username,
      addedAt:        watchlist.addedAt,
    })
    .from(watchlist)
    .innerJoin(items, eq(watchlist.itemId, items.id))
    .innerJoin(users, eq(items.userId, users.id))
    .where(eq(watchlist.userId, me.id))
    .orderBy(desc(watchlist.addedAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [me] = await db.select({ id: users.id }).from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  await db.insert(watchlist).values({ userId: me.id, itemId }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
