import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { items, users } from '@/db/schema';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return NextResponse.json([]);
  }

  const rows = await db
    .select({
      id:                     items.id,
      userId:                 items.userId,
      name:                   items.name,
      category:               items.category,
      condition:              items.condition,
      estimatedValue:         items.estimatedValue,
      location:               items.location,
      tradePreference:        items.tradePreference,
      description:            items.description,
      lookingFor:             items.lookingFor,
      notes:                  items.notes,
      cashDifferenceAccepted: items.cashDifferenceAccepted,
      frontImageUrl:          items.frontImageUrl,
      backImageUrl:           items.backImageUrl,
      isForTrade:             items.isForTrade,
      addedAt:                items.addedAt,
      tags:                   items.tags,
      watcherCount:           sql<number>`(select count(*) from watchlist where watchlist.item_id = ${items.id})`.mapWith(Number),
    })
    .from(items)
    .where(eq(items.userId, user.id))
    .orderBy(items.addedAt);

  return NextResponse.json(rows.map((r) => ({ ...r, addedAt: r.addedAt.toISOString() })));
}
