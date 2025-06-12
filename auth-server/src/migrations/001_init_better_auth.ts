import { Kysely, sql } from 'kysely';

/**
 * Initial Better-Auth schema for Postgres.
 *
 * We keep the table / column names identical to Better-Auth defaults so the
 * adapter works out-of-the-box (no custom mapping required).
 */

export async function up(db: Kysely<any>): Promise<void> {
  // -------------------------------------------------------------------------
  // user
  // -------------------------------------------------------------------------
  await db.schema
    .createTable('user')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('emailVerified', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('image', 'text')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // -------------------------------------------------------------------------
  // session
  // -------------------------------------------------------------------------
  await db.schema
    .createTable('session')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade')
    )
    .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
    .addColumn('token', 'text', (col) => col.notNull().unique())
    .addColumn('ipAddress', 'text')
    .addColumn('userAgent', 'text')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // -------------------------------------------------------------------------
  // account
  // -------------------------------------------------------------------------
  await db.schema
    .createTable('account')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade')
    )
    .addColumn('accountId', 'text', (col) => col.notNull())
    .addColumn('providerId', 'text', (col) => col.notNull())
    .addColumn('accessToken', 'text')
    .addColumn('refreshToken', 'text')
    .addColumn('idToken', 'text')
    .addColumn('accessTokenExpiresAt', 'timestamp')
    .addColumn('refreshTokenExpiresAt', 'timestamp')
    .addColumn('scope', 'text')
    .addColumn('password', 'text')
    .addColumn('expiresAt', 'timestamp')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // -------------------------------------------------------------------------
  // verification
  // -------------------------------------------------------------------------
  await db.schema
    .createTable('verification')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('identifier', 'text', (col) => col.notNull())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('verification').execute();
  await db.schema.dropTable('account').execute();
  await db.schema.dropTable('session').execute();
  await db.schema.dropTable('user').execute();
}
