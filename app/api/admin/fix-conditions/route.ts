import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const result = await db.execute(sql`
    UPDATE items
    SET condition = CASE
      WHEN name ILIKE '%PSA%' THEN 'PSA Graded'
      WHEN name ILIKE '%BGS%' THEN 'BGS Graded'
      ELSE 'Raw'
    END
    RETURNING id, name, condition
  `);

  return NextResponse.json({ updated: result.rows });
}
