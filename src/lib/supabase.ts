import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qfxifmpmlalocjpdrcvp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeGifbXBtbGFsb2NqcGRyY3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjI3MDAsImV4cCI6MjA2MTc5ODcwMH0.4mh2LX7kF6mLx9x89i7p9L8n9Z7kZ5kJ8x4Y8n5M8k'

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
