import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getDbPool()
    const result = await pool.query(`
      SELECT 
        c.*,
        COALESCE(COUNT(DISTINCT r.id), 0) as receipt_count,
        COALESCE(SUM(r.quantity), 0) as total_quantity
      FROM contractors c
      LEFT JOIN receipts r ON c.id = r.contractor_id AND r.is_hidden = false
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.contractor_name
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching contractors:', error)
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { contractor_name, phone_number } = await request.json()
    const pool = getDbPool()
    const result = await pool.query(`
      INSERT INTO contractors (contractor_name, phone_number, is_active)
      VALUES ($1, $2, true)
      RETURNING *
    `, [contractor_name, phone_number || ''])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating contractor:', error)
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 })
  }
}
