/*
 * Drizzle-ORM schema for Better-Auth.
 *
 * We follow the canonical schema recommended in the Better-Auth docs.
 * All primary keys are text UUIDs so the same schema works for SQLite, MySQL
 * and Postgres. For this demo we only target Postgres.
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------- users ---
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Better-Auth expects string IDs
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// -------------------------------------------------------------- accounts --
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),
    // Optional tokens & metadata
    password: text('password'),
    scope: text('scope'),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    provider_account: uniqueIndex('provider_account').on(t.providerId, t.accountId),
  })
);

// -------------------------------------------------------------- sessions --
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    user_expires: index('user_expires').on(t.userId, t.expiresAt),
  })
);

// ---------------------------------------------------- verification_tokens --
export const verificationTokens = pgTable('verification_tokens', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --------------------------------------------------------------- jwks ----
export const jwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Provide both plural and singular keys so Better-Auth can resolve either
export const user = users;
export const account = accounts;
export const session = sessions;
export const verificationToken = verificationTokens;
export const jwk = jwks;

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  jwks,
  user,
  account,
  session,
  verificationToken,
  jwk,
};

// The adapter expects the schema object to be the default export OR passed
// explicitly. We export individually above and collectively here.
export default schema;
