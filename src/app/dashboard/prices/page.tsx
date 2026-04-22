'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { formatNumber } from '@/lib/utils'

export default function PricesPage() {
  const { user } = useAuth()
  const [prices, setPrices] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const token = localStorage.getItem('agc_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const [pricesRes, projectsRes, materialsRes] = await Promise.all([
        fetch('/api/prices', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/materials', { headers }),
      ])
      
      const [pricesData, projectsData, materialsData] = await Promise.all([
        pricesRes.json(),
        projectsRes.json(),
        materialsRes.json(),
      ])
      
      setPrices(pricesData)
      setProjects(projectsData)
      setMaterials(materialsData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deletePrice(id: string) {
    if (!confirm('هل تريد حذف هذا السعر؟')) return
    try {
      const token = localStorage.getItem('agc_token')
      await fetch(`/api/prices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'project_name', header: 'المشروع', cell: ({ row }) => row.original.project_name || '-' },
    { accessorKey: 'material_name', header: 'المادة', cell: ({ row }) => row.original.material_name || '-' },
    { accessorKey: 'price_per_unit', header: 'السعر', cell: ({ row }) => formatNumber(row.original.price_per_unit) },
    { 
      accessorKey: 'updated_at', 
      header: 'آخر تحديث',
      cell: ({ row }) => new Date(row.original.updated_at).toLocaleDateString('ar-IQ')
    },
    ...(user?.role === 'ADMIN' ? [{
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Edit size={18} /></button>
          <button onClick={() => deletePrice(row.original.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
        </div>
      )
    }] : [])
  ], [user])

  const table = useReactTable({
    data: prices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter: searchTerm },
    onGlobalFilterChange: setSearchTerm,
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">قائمة الأسعار</h1>
          <p className="text-gray-500 mt-1">إجمالي: {prices.length} سعر</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={20} /> إضافة سعر
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>{hg.headers.map(h => (
                  <th key={h.id} className="px-4 py-3 text-right text-sm font-medium text-gray-500">{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}</tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-500">لا توجد أسعار</td></tr>
              ) : table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <PriceModal projects={projects} materials={materials} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchData() }} />}
    </div>
  )
}

function PriceModal({ projects, materials, onClose, onSuccess }: { projects: any[]; materials: any[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ project_id: '', material_id: '', price_per_unit: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('agc_token')
      await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          project_id: form.project_id || null,
          material_id: form.material_id || null,
          price_per_unit: parseFloat(form.price_per_unit),
        })
      })
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">إضافة سعر</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المشروع *</label>
            <select required value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">اختر المشروع</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المادة *</label>
            <select required value={form.material_id} onChange={e => setForm({...form, material_id: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">اختر المادة</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السعر *</label>
            <input type="number" required step="0.01" value={form.price_per_unit} onChange={e => setForm({...form, price_per_unit: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? '...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
