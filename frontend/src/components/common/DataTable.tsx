// 设计提醒：表格是后台核心，需保持高可读、水平滚动友好，分页反馈清楚但不过度装饰。
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type Column<T> = {
  key: keyof T | string
  title: string
  render?: (row: T) => React.ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  showPagination?: boolean
}

export default function DataTable<T>({ columns, data, pageSize = 10, showPagination = true }: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))

  const currentData = useMemo(() => {
    if (!showPagination) return data
    const start = (page - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, page, pageSize, showPagination])

  useMemo(() => {
    if (page > pageCount) setPage(1)
  }, [page, pageCount])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={`whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${column.className ?? ''}`}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {currentData.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={String(column.key)} className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
          <span>共 {data.length} 条 · 第 {page} / {pageCount} 页</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
