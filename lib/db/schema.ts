import { pgTable, text, uuid, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core'
import type { Guest, WeddingSettings } from '@/lib/wedding'

export const invitations = pgTable('wedding_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('userId').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  greetingPl: text('greeting_pl').notNull().default(''),
  greetingEn: text('greeting_en').notNull().default(''),
  guests: jsonb('guests').$type<Guest[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  reopenUntil: timestamp('reopen_until', { withTimezone: true }),
  message: text('message').notNull().default(''),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const weddingSettings = pgTable('wedding_settings', {
  id: text('id').primaryKey().default('wedding'),
  userId: text('userId').notNull(),
  content: jsonb('content').$type<WeddingSettings>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
