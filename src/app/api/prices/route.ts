import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getDbPool()
    const result = await pool.query(`
      SELECT 
        pl.*,
        p.project_name,
        m.material_name
      FROM price_lists pl
      LEFT JOIN projects p ON pl.project_id = p.id
      LEFT JOIN materials m ON pl.material_id = m.id
      ORDER BY pl.updated_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { project_id, material_id, price_per_unit } = await request.json()
    const pool = getDbPool()
    const result = await pool.query(`
      INSERT INTO price_lists (project_id, material_id, price_per_unit)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [project_id, material_id, price_per_unit])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating price:', error)
    return NextResponse.json({ error: 'Failed to create price' }, { status: 500 })
  }
}
