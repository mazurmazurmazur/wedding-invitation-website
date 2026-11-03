import 'server-only'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'
import { databaseUrl } from './connection-string'

const globalDb = globalThis as unknown as { weddingPool?: Pool }
export const pool = globalDb.weddingPool ?? new Pool({ connectionString: databaseUrl(), max: 5 })
if (process.env.NODE_ENV !== 'production') globalDb.weddingPool = pool
export const db = drizzle(pool, { schema })
