import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    ...user,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const [updated] = await db
    .update(users)
    .set({
      ...(body.bio                         !== undefined && { bio: body.bio }),
      ...(body.location                    !== undefined && { location: body.location }),
      ...(body.lookingFor                  !== undefined && { lookingFor: body.lookingFor }),
      ...(body.paymentDetails              !== undefined && { paymentDetails: body.paymentDetails }),
      ...(body.emailNotificationsEnabled   !== undefined && { emailNotificationsEnabled: body.emailNotificationsEnabled }),
    })
    .where(eq(users.email, session.user.email))
    .returning();

  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({
    ...updated,
    lastLoginAt: updated.lastLoginAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
}
