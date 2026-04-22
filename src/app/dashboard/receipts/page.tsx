'use client'

import { useEffect, useState, useMemo } from 'react'
import { ReceiptWithDetails } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatNumber, formatDate } from '@/lib/utils'
import { 
  Search, Plus, Filter, Download, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, Receipt as ReceiptIcon, X
} from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'

export default function ReceiptsPage() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<ReceiptWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithDetails | null>(null)

  useEffect(() => {
    fetchReceipts()
  }, [])

  async function fetchReceipts() {
    try {
      const token = localStorage.getItem('agc_token')
      const res = await fetch('/api/receipts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setReceipts(data)
    } catch (error) {
      console.error('Error fetching receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<ReceiptWithDetails>[] = useMemo(() => [
    {
      accessorKey: 'receipt_number',
      header: 'رقم الوصل',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.receipt_number}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'الكمية',
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    {
      accessorKey: 'shortage',
      header: 'النقص',
      cell: ({ row }) => formatNumber(row.original.shortage),
    },
    {
      accessorKey: 'contractor_name',
      header: 'المقاول',
      cell: ({ row }) => row.original.contractor_name || '-',
    },
    {
      accessorKey: 'project_name',
      header: 'المشروع',
      cell: ({ row }) => row.original.project_name || '-',
    },
    {
      accessorKey: 'material_name',
      header: 'المادة',
      cell: ({ row }) => row.original.material_name || '-',
    },
    {
      accessorKey: 'receipt_date',
      header: 'التاريخ',
      cell: ({ row }) => formatDate(row.original.receipt_date),
    },
    {
      accessorKey: 'is_audited',
      header: 'الحالة',
      cell: ({ row }) => (
        row.original.is_audited ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            تم التدقيق
          </span>
        ) : (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            قيد الانتظار
          </span>
        )
      ),
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedReceipt(row.original)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Eye size={18} />
          </button>
          {user?.role === 'ADMIN' && (
            <>
              <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Edit size={18} />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ], [user])

  const table = useReactTable({
    data: receipts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  if (loading) {
    return <div className="animate-pulse">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإيصالات</h1>
          <p className="text-gray-500 mt-1">إجمالي: {formatNumber(receipts.length)} وصلة</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            إضافة وصلة
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث برقم الوصل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter size={20} />
          تصدير
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-right text-sm font-medium text-gray-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-gray-500">
                    لا توجد إيصالات
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <ReceiptDetailModal 
          receipt={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
        />
      )}

      {/* Add Receipt Modal */}
      {showAddModal && (
        <AddReceiptModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false)
            fetchReceipts()
          }} 
        />
      )}
    </div>
  )
}

function ReceiptDetailModal({ receipt, onClose }: { receipt: ReceiptWithDetails; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">تفاصيل الوصل</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">رقم الوصل</p>
              <p className="font-mono font-medium">{receipt.receipt_number}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">التاريخ</p>
              <p className="font-medium">{formatDate(receipt.receipt_date)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">الكمية</p>
              <p className="font-medium">{formatNumber(receipt.quantity)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">النقص</p>
              <p className="font-medium">{formatNumber(receipt.shortage)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">المقاول</p>
              <p className="font-medium">{receipt.contractor_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">المشروع</p>
              <p className="font-medium">{receipt.project_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">المادة</p>
              <p className="font-medium">{receipt.material_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">رقم السيارة</p>
              <p className="font-medium">{receipt.manual_vehicle_number || receipt.vehicle_number || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">السائق</p>
              <p className="font-medium">{receipt.manual_driver_name || receipt.driver_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">الحالة</p>
              <span className={`px-2 py-1 rounded-full text-xs ${receipt.is_audited ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {receipt.is_audited ? 'تم التدقيق' : 'قيد الانتظار'}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">السعر الثابت</p>
              <p className="font-medium">{receipt.fixed_price > 0 ? formatNumber(receipt.fixed_price) : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">المسجل</p>
              <p className="font-medium">{receipt.registrar_name || '-'}</p>
            </div>
          </div>
          {receipt.notes && (
            <div>
              <p className="text-gray-500 text-sm">ملاحظات</p>
              <p className="font-medium">{receipt.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddReceiptModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    receipt_number: '',
    quantity: '',
    shortage: '0',
    contractor_id: '',
    project_id: '',
    material_id: '',
    vehicle_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('agc_token')
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receipt_number: formData.receipt_number,
          quantity: parseFloat(formData.quantity),
          shortage: parseFloat(formData.shortage || '0'),
          contractor_id: formData.contractor_id || null,
          project_id: formData.project_id || null,
          material_id: formData.material_id || null,
          vehicle_id: formData.vehicle_id || null,
          receipt_date: formData.receipt_date,
          notes: formData.notes,
          manual_vehicle_number: '',
          manual_driver_name: '',
        })
      })

      if (!res.ok) throw new Error('Failed to add receipt')
      onSuccess()
    } catch (error) {
      console.error('Error adding receipt:', error)
      alert('حدث خطأ أثناء إضافة الوصل')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">إضافة وصلة جديدة</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوصل *</label>
            <input
              type="text"
              required
              value={formData.receipt_number}
              onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية *</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النقص</label>
              <input
                type="number"
                value={formData.shortage}
                onChange={(e) => setFormData({ ...formData, shortage: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ *</label>
            <input
              type="date"
              required
              value={formData.receipt_date}
              onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
