import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, items } from '@/db/schema';

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userItems = await db
    .select()
    .from(items)
    .where(eq(items.userId, user.id))
    .orderBy(items.addedAt);

  return NextResponse.json({
    user: {
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt:   user.createdAt.toISOString(),
    },
    items: userItems.map((i) => ({ ...i, addedAt: i.addedAt.toISOString() })),
  });
}
