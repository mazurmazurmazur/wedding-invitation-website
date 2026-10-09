import { pgTable, text, uuid, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core'
import type { Guest, WeddingSettings } from '@/lib/wedding'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(), emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull(),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const invitations = pgTable('wedding_invitations', {
  id: uuid('id').primaryKey().defaultRandom(), userId: text('userId').notNull(), tokenHash: text('token_hash').notNull().unique(), token: text('token'), greetingPl: text('greeting_pl').notNull().default(''), greetingEn: text('greeting_en').notNull().default(''), guests: jsonb('guests').$type<Guest[]>().notNull().default([]), active: boolean('active').notNull().default(true), reopenUntil: timestamp('reopen_until', { withTimezone: true }), message: text('message').notNull().default(''), respondedAt: timestamp('responded_at', { withTimezone: true }), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
export const weddingSettings = pgTable('wedding_settings', {
  id: text('id').primaryKey().default('wedding'), userId: text('userId').notNull(), content: jsonb('content').$type<WeddingSettings>().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
