import { EmptyState } from "@/components/feedback/EmptyState"
import { TableRowSkeleton } from "@/components/feedback/LoadingSkeleton"
import { cn } from "@/lib/cn"
import type { Key, ReactNode } from "react"

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  getRowKey: (row: T, index: number) => Key
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  loading,
  emptyTitle = "Sin resultados",
  emptyDescription,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn("px-4 py-2.5 text-left font-medium text-[var(--color-text-secondary)] whitespace-nowrap", column.headerClassName)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} className="py-10" />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-neutral-50)]"
                >
                  {columns.map((column) => (
                    <td key={column.id} className={cn("px-4 py-3 align-middle", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
