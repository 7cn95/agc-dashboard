'use client'

import { useEffect, useState } from 'react'
import { Receipt } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => { fetchReceipts() }, [])

  async function fetchReceipts() {
    try {
      const token = localStorage.getItem('agc_token')
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      
      const url = '/api/receipts' + (params.toString() ? `?${params}` : '')
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setReceipts(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [dateFrom, dateTo])

  const totalQuantity = receipts.reduce((sum, r) => sum + (r.quantity || 0), 0)
  const totalShortage = receipts.reduce((sum, r) => sum + (r.shortage || 0), 0)
  const auditedCount = receipts.filter(r => r.is_audited).length

  const projectData = receipts.reduce((acc: any, r) => {
    const key = r.project_id || 'unknown'
    if (!acc[key]) acc[key] = { name: r.project_name || 'غير محدد', value: 0 }
    acc[key].value += r.quantity || 0
    return acc
  }, {})

  const dateData = receipts.reduce((acc: any, r) => {
    const date = r.receipt_date || 'unknown'
    if (!acc[date]) acc[date] = { date, quantity: 0, shortage: 0 }
    acc[date].quantity += r.quantity || 0
    acc[date].shortage += r.shortage || 0
    return acc
  }, {})

  const dateChartData = Object.values(dateData).slice(0, 10).reverse()
  const projectChartData = Object.values(projectData).slice(0, 6)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
        <p className="text-gray-500 mt-1">تحليل البيانات والإحصائيات</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <Calendar size={20} className="text-gray-400" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">إلى</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => { setDateFrom(''); setDateTo('') }}
          className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          إعادة تعيين
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">إجمالي الإيصالات</p>
          <p className="text-3xl font-bold mt-2">{formatNumber(receipts.length)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">الكمية الإجمالية</p>
          <p className="text-3xl font-bold mt-2">{formatNumber(totalQuantity)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">إجمالي النقص</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{formatNumber(totalShortage)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">نسبة التدقيق</p>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {receipts.length > 0 ? Math.round((auditedCount / receipts.length) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">الكمية حسب التاريخ</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#3B82F6" name="الكمية" />
                <Bar dataKey="shortage" fill="#EF4444" name="النقص" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">التوزيع حسب المشروع</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {projectChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
          <Download size={20} />
          تصدير Excel
        </button>
      </div>
    </div>
  )
}
