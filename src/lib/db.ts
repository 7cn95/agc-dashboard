import { Pool } from 'pg'

let pool: Pool | null = null

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DATABASE_HOST || 'aws-1-us-east-2.pooler.supabase.com',
      port: parseInt(process.env.DATABASE_PORT || '6543'),
      database: process.env.DATABASE_NAME || 'postgres',
      user: process.env.DATABASE_USER || 'postgres.qfxifmpmlalocjpdrcvp',
      password: process.env.DATABASE_PASSWORD || 'adminIT123@@',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}