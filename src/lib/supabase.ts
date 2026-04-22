import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // During build, these may not be set. Use empty strings to allow build to succeed.
  // Runtime will use actual values from environment.
  console.warn('Missing Supabase environment variables - using empty defaults')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types matching our schema
export interface User {
  id: string
  name: string
  username: string
  password: string
  role: 'ADMIN' | 'USER'
  is_active: boolean
  created_at: string
}

export interface Contractor {
  id: string
  contractor_name: string
  phone_number: string
  is_active: boolean
  created_at: string
}

export interface Material {
  id: string
  material_name: string
  is_hidden: boolean
  created_at: string
}

export interface Project {
  id: string
  project_name: string
  is_active: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  vehicle_number: string
  driver_name: string
  capacity_volume: number
  is_active: boolean
  created_at: string
}

export interface Receipt {
  id: string
  project_id: string | null
  material_id: string | null
  contractor_id: string | null
  registrar_id: string | null
  vehicle_id: string | null
  receipt_number: string
  manual_vehicle_number: string
  manual_driver_name: string
  quantity: number
  shortage: number
  recorded_capacity: number
  fixed_price: number
  is_audited: boolean
  is_hidden: boolean
  receipt_date: string
  receipt_time: string
  notes: string
  created_at: string
}

export interface PriceList {
  id: string
  project_id: string
  material_id: string
  price_per_unit: number
  updated_at: string
}

export interface ArchiveLog {
  id: string
  name: string
  location: string
  data: any
  created_at: string
}

// Join types
export interface ReceiptWithDetails extends Receipt {
  projects?: { project_name: string }
  materials?: { material_name: string }
  contractors?: { contractor_name: string }
  users?: { name: string }
  vehicles?: { vehicle_number: string; driver_name: string }
}
