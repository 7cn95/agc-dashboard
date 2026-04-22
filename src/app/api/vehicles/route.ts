import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getDbPool()
    const result = await pool.query(`
      SELECT 
        v.*,
        COALESCE(COUNT(DISTINCT r.id), 0) as receipt_count,
        COALESCE(SUM(r.quantity), 0) as total_quantity
      FROM vehicles v
      LEFT JOIN receipts r ON v.id = r.vehicle_id AND r.is_hidden = false
      WHERE v.is_active = true
      GROUP BY v.id
      ORDER BY v.vehicle_number
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { vehicle_number, driver_name, capacity_volume } = await request.json()
    const pool = getDbPool()
    const result = await pool.query(`
      INSERT INTO vehicles (vehicle_number, driver_name, capacity_volume, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `, [vehicle_number, driver_name || '', capacity_volume || 0])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}
