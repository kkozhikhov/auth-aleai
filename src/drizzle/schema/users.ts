import { pgTable as table } from 'drizzle-orm/pg-core';
import * as t from 'drizzle-orm/pg-core';

// ! check and optimize name with min max
export const users = table('users', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  username: t.varchar().notNull().unique(),
  password: t.varchar().notNull(),
  firstName: t.varchar('first_name', { length: 256 }).notNull(),
  lastName: t.varchar('last_name', { length: 256 }).notNull(),
});
