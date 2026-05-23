import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  loading?: boolean
  error?: string
  emptyMessage?: string
  page?: number
  total?: number
  limit?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  error,
  emptyMessage = 'Sin registros.',
  page,
  total,
  limit,
  onPageChange,
}: DataTableProps<T>) {
  if (loading) {
    return <p className="text-gray-400 text-sm">Cargando...</p>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">{emptyMessage}</p>
  }

  const hasPagination = page !== undefined && total !== undefined && limit !== undefined && onPageChange
  const totalPages = hasPagination ? Math.ceil(total! / limit!) : 1

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.headerClassName ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasPagination && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Página {page} de {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange!(page! - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange!(page! + 1)}
              disabled={page! >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
