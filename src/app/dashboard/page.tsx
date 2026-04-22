'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Receipt as ReceiptIcon, Users, Truck, Building2, Package, 
  TrendingUp, Calendar, ArrowUpRight 
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

interface Stats {
  totalReceipts: number
  totalContractors: number
  totalVehicles: number
  totalProjects: number
  totalMaterials: number
  totalUsers: number
  recentReceipts: any[]
  todayReceipts: number
  todayQuantity: number
}

export default function DashboardPage() {
  const { user } = useAuth()
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
      const token = localStorage.getItem('agc_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [receiptsRes, contractorsRes, vehiclesRes, projectsRes, materialsRes] = await Promise.all([
        fetch('/api/receipts', { headers }),
        fetch('/api/contractors', { headers }),
        fetch('/api/vehicles', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/materials', { headers }),
      ])

      const [receipts, contractors, vehicles, projects, materials] = await Promise.all([
        receiptsRes.json(),
        contractorsRes.json(),
        vehiclesRes.json(),
        projectsRes.json(),
        materialsRes.json(),
      ])

      // Filter today's receipts
      const todayReceipts = receipts.filter((r: any) => r.receipt_date === today)
      const todayQuantity = todayReceipts.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0)

      setStats({
        totalReceipts: receipts.length,
        totalContractors: contractors.length,
        totalVehicles: vehicles.length,
        totalProjects: projects.length,
        totalMaterials: materials.length,
        totalUsers: 0,
        recentReceipts: receipts.slice(0, 5),
        todayReceipts: todayReceipts.length,
        todayQuantity: todayQuantity,
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
            <p className="text-3xl font-bold">{user?.name || '-'}</p>
          </div>
        </div>
      </div>

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
