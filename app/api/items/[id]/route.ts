import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { items, users } from '@/db/schema';

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = await resolveUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
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
  return NextResponse.json({ ...updated, addedAt: updated.addedAt.toISOString() });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = await resolveUserId(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db.delete(items).where(and(eq(items.id, id), eq(items.userId, userId)));
  return new NextResponse(null, { status: 204 });
}
