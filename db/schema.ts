import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:            uuid('id').primaryKey().defaultRandom(),
  email:         text('email').notNull().unique(),
  username:      text('username').notNull().unique(),
  displayName:   text('display_name').notNull().default(''),
  avatarUrl:     text('avatar_url').notNull().default(''),
  bio:            text('bio').notNull().default(''),
  location:       text('location').notNull().default('Philippines'),
  lookingFor:     text('looking_for').notNull().default('No preference'),
  paymentDetails: text('payment_details').notNull().default(''),
  tier:          text('tier').notNull().default('verified'),
  isWhitelisted: boolean('is_whitelisted').notNull().default(false),
  isActive:      boolean('is_active').notNull().default(false),
  lastLoginAt:   timestamp('last_login_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const items = pgTable('items', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  userId:                 uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:                   text('name').notNull(),
  category:               text('category').notNull(),
  condition:              text('condition').notNull(),
  estimatedValue:         integer('estimated_value').notNull(),
  location:               text('location').notNull(),
  tradePreference:        text('trade_preference').notNull(),
  frontImageUrl:          text('front_image_url').notNull(),
  backImageUrl:           text('back_image_url').notNull().default(''),
  description:            text('description').notNull().default(''),
  lookingFor:             text('looking_for').notNull().default(''),
  cashDifferenceAccepted: boolean('cash_difference_accepted').notNull().default(false),
  tags:                   text('tags').array().notNull().default([]),
  notes:                  text('notes').notNull().default(''),
  isForTrade:             boolean('is_for_trade').notNull().default(true),
  addedAt:                timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});

export const whitelist = pgTable('whitelist', {
  id:      uuid('id').primaryKey().defaultRandom(),
  email:   text('email').notNull().unique(),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tradeOffers = pgTable('trade_offers', {
  id:               uuid('id').primaryKey().defaultRandom(),
  fromUserId:       uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId:         uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  offeredItemIds:   text('offered_item_ids').array().notNull().default([]),
  requestedItemIds: text('requested_item_ids').array().notNull().default([]),
  cashDiff:         integer('cash_diff').notNull().default(0),
  message:          text('message').notNull().default(''),
  status:           text('status').notNull().default('pending'),
  readAt:           timestamp('read_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const watchlist = pgTable('watchlist', {
  id:      uuid('id').primaryKey().defaultRandom(),
  userId:  uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId:  uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id:         uuid('id').primaryKey().defaultRandom(),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId:   uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text:       text('text').notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbWatchlist   = typeof watchlist.$inferSelect;
export type DbUser      = typeof users.$inferSelect;
export type NewUser     = typeof users.$inferInsert;
export type DbItem      = typeof items.$inferSelect;
export type NewItem     = typeof items.$inferInsert;
export type DbWhitelist = typeof whitelist.$inferSelect;
export type DbMessage     = typeof messages.$inferSelect;
export type DbTradeOffer  = typeof tradeOffers.$inferSelect;
