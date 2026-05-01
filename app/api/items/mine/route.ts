import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
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
    .select()
    .from(items)
    .where(eq(items.userId, user.id))
    .orderBy(items.addedAt);

  return NextResponse.json(rows.map((r) => ({ ...r, addedAt: r.addedAt.toISOString() })));
}
