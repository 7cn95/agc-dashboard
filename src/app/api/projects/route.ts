import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getDbPool()
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(COUNT(DISTINCT r.id), 0) as receipt_count,
        COALESCE(SUM(r.quantity), 0) as total_quantity
      FROM projects p
      LEFT JOIN receipts r ON p.id = r.project_id AND r.is_hidden = false
      WHERE p.is_active = true
      GROUP BY p.id
      ORDER BY p.project_name
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { project_name } = await request.json()
    const pool = getDbPool()
    const result = await pool.query(`
      INSERT INTO projects (project_name, is_active)
      VALUES ($1, true)
      RETURNING *
    `, [project_name])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
