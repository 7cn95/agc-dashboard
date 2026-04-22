'use client'

import { useEffect, useState } from 'react'
import { supabase, Receipt, Contractor, Vehicle, Project, Material, User } from '@/lib/supabase'
import { 
  Receipt as ReceiptIcon, Users, Truck, Building2, Package, 
  TrendingUp, Calendar, ArrowUpRight 
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface Stats {
  totalReceipts: number
  totalContractors: number
  totalVehicles: number
  totalProjects: number
  totalMaterials: number
  totalUsers: number
  recentReceipts: Receipt[]
  todayReceipts: number
  todayQuantity: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalReceipts: 0,
    totalContractors: 0,
    totalVehicles: 0,
    totalProjects: 0,
    totalMaterials: 0,
    totalUsers: 0,
    recentReceipts: [],
    todayReceipts: 0,
    todayQuantity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [
        receiptsRes,
        contractorsRes,
        vehiclesRes,
        projectsRes,
        materialsRes,
        usersRes,
        todayReceiptsRes,
      ] = await Promise.all([
        supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('contractors').select('id'),
        supabase.from('vehicles').select('id'),
        supabase.from('projects').select('id'),
        supabase.from('materials').select('id'),
        supabase.from('users').select('id'),
        supabase.from('receipts').select('quantity').eq('receipt_date', today),
      ])

      const todayReceipts = todayReceiptsRes.data || []
      const totalQuantity = todayReceipts.reduce((sum, r) => sum + (r.quantity || 0), 0)

      setStats({
        totalReceipts: receiptsRes.count || 0,
        totalContractors: contractorsRes.data?.length || 0,
        totalVehicles: vehiclesRes.data?.length || 0,
        totalProjects: projectsRes.data?.length || 0,
        totalMaterials: materialsRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        recentReceipts: receiptsRes.data || [],
        todayReceipts: todayReceipts.length,
        todayQuantity: totalQuantity,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">جاري التحميل...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">مرحباً بك في نظام إدارة الإيصالات</p>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar size={20} />
          <span>{new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الإيصالات"
          value={formatNumber(stats.totalReceipts)}
          icon={ReceiptIcon}
          color="blue"
          href="/dashboard/receipts"
        />
        <StatCard
          title="المقاولين"
          value={formatNumber(stats.totalContractors)}
          icon={Users}
          color="green"
          href="/dashboard/contractors"
        />
        <StatCard
          title="المركبات"
          value={formatNumber(stats.totalVehicles)}
          icon={Truck}
          color="purple"
          href="/dashboard/vehicles"
        />
        <StatCard
          title="المشاريع"
          value={formatNumber(stats.totalProjects)}
          icon={Building2}
          color="orange"
          href="/dashboard/projects"
        />
      </div>

      {/* Today's Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={24} />
          <h2 className="text-xl font-bold">إحصائيات اليوم</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100">عدد الإيصالات</p>
            <p className="text-3xl font-bold">{stats.todayReceipts}</p>
          </div>
          <div>
            <p className="text-blue-100">الكمية الإجمالية</p>
            <p className="text-3xl font-bold">{formatNumber(stats.todayQuantity)}</p>
          </div>
          <div>
            <p className="text-blue-100">عدد المستخدمين</p>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      {/* Recent Receipts */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">آخر الإيصالات</h2>
          <Link
            href="/dashboard/receipts"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            عرض الكل
            <ArrowUpRight size={18} />
          </Link>
        </div>

        {stats.recentReceipts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد إيصالات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right text-gray-500 border-b">
                  <th className="pb-3 font-medium">رقم الوصل</th>
                  <th className="pb-3 font-medium">الكمية</th>
                  <th className="pb-3 font-medium">التاريخ</th>
                  <th className="pb-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-sm">{receipt.receipt_number}</td>
                    <td className="py-3">{formatNumber(receipt.quantity)}</td>
                    <td className="py-3 text-gray-500">{receipt.receipt_date}</td>
                    <td className="py-3">
                      {receipt.is_audited ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          تم التدقيق
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          قيد الانتظار
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  href 
}: { 
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
  href: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    </Link>
  )
}
