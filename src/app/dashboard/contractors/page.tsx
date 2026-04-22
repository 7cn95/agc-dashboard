'use client'

import { useEffect, useState, useMemo } from 'react'
import { Contractor } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table'

export default function ContractorsPage() {
  const { user } = useAuth()
  const [contractors, setContractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { fetchContractors() }, [])

  async function fetchContractors() {
    try {
      const token = localStorage.getItem('agc_token')
      const res = await fetch('/api/contractors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setContractors(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteContractor(id: string) {
    if (!confirm('هل تريد حذف هذا المقاول؟')) return
    try {
      const token = localStorage.getItem('agc_token')
      await fetch(`/api/contractors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchContractors()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'contractor_name', header: 'اسم المقاول', cell: info => info.getValue() },
    { accessorKey: 'phone_number', header: 'رقم الهاتف', cell: info => info.getValue() || '-' },
    { 
      accessorKey: 'is_active', 
      header: 'الحالة',
      cell: ({ row }) => row.original.is_active ? 
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">نشط</span> :
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">غير نشط</span>
    },
    ...(user?.role === 'ADMIN' ? [{
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Edit size={18} /></button>
          <button onClick={() => deleteContractor(row.original.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
        </div>
      )
    }] : [])
  ], [user])

  const table = useReactTable({
    data: contractors,
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
          <h1 className="text-3xl font-bold text-gray-900">المقاولين</h1>
          <p className="text-gray-500 mt-1">إجمالي: {contractors.length} مقاول</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={20} /> إضافة مقاول
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
                <tr><td colSpan={4} className="text-center py-12 text-gray-500">لا توجد مقاولين</td></tr>
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

      {showAddModal && <ContractorModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchContractors() }} />}
    </div>
  )
}

function ContractorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ contractor_name: '', phone_number: '', is_active: true })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('agc_token')
      await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
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
          <h2 className="text-xl font-bold">إضافة مقاول</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المقاول *</label>
            <input type="text" required value={form.contractor_name} onChange={e => setForm({...form, contractor_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
            <input type="text" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})}
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
