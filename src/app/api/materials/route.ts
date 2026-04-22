import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getDbPool()
    const result = await pool.query(`
      SELECT 
        m.*,
        COALESCE(COUNT(DISTINCT r.id), 0) as receipt_count,
        COALESCE(SUM(r.quantity), 0) as total_quantity
      FROM materials m
      LEFT JOIN receipts r ON m.id = r.material_id AND r.is_hidden = false
      WHERE m.is_hidden = false
      GROUP BY m.id
      ORDER BY m.material_name
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { material_name } = await request.json()
    const pool = getDbPool()
    const result = await pool.query(`
      INSERT INTO materials (material_name, is_hidden)
      VALUES ($1, false)
      RETURNING *
    `, [material_name])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}
