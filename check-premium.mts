import { db } from './db/index.ts';
import { users } from './db/schema.ts';
import { eq } from 'drizzle-orm';

const rows = await db.select({ email: users.email, username: users.username, tier: users.tier, isWhitelisted: users.isWhitelisted }).from(users).where(eq(users.tier, 'premium'));
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
