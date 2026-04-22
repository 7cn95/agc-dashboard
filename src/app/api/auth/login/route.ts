import { NextResponse } from 'next/server'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'agc-dashboard-secret-key-change-in-production'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    // Connect to Supabase PostgreSQL
    const client = new Client({
      host: process.env.DATABASE_HOST || 'aws-1-us-east-2.pooler.supabase.com',
      port: parseInt(process.env.DATABASE_PORT || '6543'),
      database: process.env.DATABASE_NAME || 'postgres',
      user: process.env.DATABASE_USER || 'postgres.qfxifmpmlalocjpdrcvp',
      password: process.env.DATABASE_PASSWORD || 'adminIT123@@',
    })

    await client.connect()

    // Query user from public.users
    const result = await client.query(
      'SELECT id, username, password, role, name, is_active FROM public.users WHERE username = $1 AND is_active = true',
      [username]
    )

    await client.end()

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'اسم المستخدم غير صحيح' }, { status: 401 })
    }

    const user = result.rows[0]

    // Verify password
    const passwordMatch = bcrypt.compareSync(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      }
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 })
  }
}
