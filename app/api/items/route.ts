import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { items, users } from '@/db/schema';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const username = searchParams.get('username');

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
      frontImageUrl:          items.frontImageUrl,
      backImageUrl:           items.backImageUrl,
      description:            items.description,
      lookingFor:             items.lookingFor,
      cashDifferenceAccepted: items.cashDifferenceAccepted,
      tags:                   items.tags,
      isForTrade:             items.isForTrade,
      addedAt:                items.addedAt,
      username:               users.username,
      displayName:            users.displayName,
      avatarUrl:              users.avatarUrl,
      ownerLookingFor:        users.lookingFor,
      ownerLocation:          users.location,
    })
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .where(username ? eq(users.username, username) : undefined)
    .orderBy(items.addedAt);

  return NextResponse.json(rows.map((r) => ({ ...r, addedAt: r.addedAt.toISOString() })));
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const [inserted] = await db
    .insert(items)
    .values({
      userId:                 user.id,
      name:                   body.name,
      category:               body.category,
      condition:              body.condition,
      estimatedValue:         body.estimatedValue,
      location:               body.location,
      tradePreference:        body.tradePreference,
      frontImageUrl:          body.frontImageUrl,
      backImageUrl:           body.backImageUrl ?? '',
      description:            body.description ?? '',
      lookingFor:             body.lookingFor ?? '',
      notes:                  body.notes ?? '',
      cashDifferenceAccepted: body.cashDifferenceAccepted ?? false,
      tags:                   body.tags ?? [],
    })
    .returning();

  return NextResponse.json({ ...inserted, addedAt: inserted.addedAt.toISOString() }, { status: 201 });
}
