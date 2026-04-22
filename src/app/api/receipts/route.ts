import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/supabase'

const pool = getDbPool()

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        p.project_name,
        m.material_name,
        c.contractor_name,
        u.name as registrar_name,
        v.vehicle_number,
        v.driver_name
      FROM receipts r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN materials m ON r.material_id = m.id
      LEFT JOIN contractors c ON r.contractor_id = c.id
      LEFT JOIN users u ON r.registrar_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.is_hidden = false
      ORDER BY r.created_at DESC
    `)
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      receipt_number, quantity, shortage, contractor_id, project_id,
      material_id, vehicle_id, receipt_date, notes,
      manual_vehicle_number, manual_driver_name, registrar_id
    } = body

    const result = await pool.query(`
      INSERT INTO receipts (
        receipt_number, quantity, shortage, contractor_id, project_id,
        material_id, vehicle_id, receipt_date, notes, is_audited, is_hidden,
        manual_vehicle_number, manual_driver_name, registrar_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,false,$10,$11,$12)
      RETURNING *
    `, [
      receipt_number, quantity, shortage || 0, contractor_id, project_id,
      material_id, vehicle_id, receipt_date, notes,
      manual_vehicle_number || '', manual_driver_name || '', registrar_id
    ])

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}