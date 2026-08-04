import { type ReactNode } from "react";
import { TABLE_CELL_CLASS, TABLE_HEADER_CLASS } from "@/shared/constants/table";
import { cn } from "@/shared/utils/cn";
import { Loader, Pagination } from "@/shared/components/ui";
import { EmptyState } from "@/shared/components/empty-state";
import { TableShell } from "@/shared/components/table-shell";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  error,
  emptyState,
  toolbar,
  actions,
  footer = <Pagination />,
}: {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  error?: Error | null;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  if (loading) {
    return (
      <TableShell>
        <Loader />
      </TableShell>
    );
  }

  if (error) {
    return (
      <TableShell>
        <EmptyState title="Não foi possível carregar os dados" description={error.message} />
      </TableShell>
    );
  }

  return (
    <TableShell footer={footer}>
      {(toolbar || actions) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">{toolbar}</div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn(TABLE_HEADER_CLASS, column.headerClassName)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && emptyState ? (
            <tr>
              <td colSpan={columns.length}>{emptyState}</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-muted/30">
                {columns.map((column) => (
                  <td key={column.key} className={cn(TABLE_CELL_CLASS, column.cellClassName)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableShell>
  );
}
