import { useCallback, useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import { ConfirmModal } from "./ConfirmModal";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface RowAction<T> {
  icon: string;
  label: string;
  onClick: (row: T) => void;
  variant?: "primary" | "danger" | "ghost";
  requireConfirm?: boolean;
  confirmTitle?: string | ((row: T) => string);
  confirmMessage?: string | ((row: T) => string);
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
  searchable?: boolean;
  searchKeys?: string[];
  sortable?: boolean;
  paginated?: boolean | number;
  rowActions?: RowAction<T>[];
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyState?: {
    title: string;
    description: string;
    action?: { label: string; href?: string; onClick?: () => void };
  };
  bulkActions?: Array<{
    label: string;
    icon: string;
    onClick: (selectedRows: T[]) => void;
    variant?: "primary" | "danger";
  }>;
}

export function DataTable<T>({
  columns,
  rows,
  className = "",
  rowKey = (_, index) => index,
  searchable = false,
  searchKeys,
  sortable = false,
  paginated = false,
  rowActions,
  selectable = false,
  onRowClick,
  isLoading = false,
  error = null,
  onRetry,
  emptyState,
  bulkActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{
    action: RowAction<T>;
    row: T;
  } | null>(null);

  const pageSize = typeof paginated === "number" ? paginated : 10;
  const totalPages = Math.ceil(rows.length / pageSize);

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (searchable && searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => {
        if (searchKeys && searchKeys.length > 0) {
          return searchKeys.some((key) => {
            const value = (row as Record<string, unknown>)[key];
            return String(value ?? "").toLowerCase().includes(query);
          });
        }
        return Object.values(row as Record<string, unknown>).some((v) =>
          String(v ?? "").toLowerCase().includes(query)
        );
      });
    }

    if (sortable && sort.key && sort.direction) {
      const sortColumn = columns.find((c) => c.key === sort.key);
      if (sortColumn?.sortFn) {
        result.sort((a, b) => {
          const cmp = sortColumn.sortFn!(a, b);
          return sort.direction === "asc" ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [rows, searchable, searchQuery, searchKeys, sortable, sort, columns]);

  const paginatedRows = useMemo(() => {
    if (!paginated) return filteredRows;
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, paginated, page, pageSize]);

  const handleSort = useCallback(
    (key: string) => {
      if (!sortable) return;
      setSort((prev) => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
      setPage(1);
    },
    [sortable]
  );

  const toggleSelectAll = useCallback(() => {
    const currentIds = paginatedRows.map((row, i) => rowKey(row, i));
    const allSelected = currentIds.every((id) => selectedRows.has(id));
    if (allSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        currentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        currentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [paginatedRows, rowKey, selectedRows]);

  const toggleSelectRow = useCallback((id: string | number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRowAction = useCallback((action: RowAction<T>, row: T) => {
    if (action.requireConfirm) {
      setConfirmAction({ action, row });
    } else {
      action.onClick(row);
    }
  }, []);

  const selectedRowData = useMemo(() => {
    return rows.filter((row, i) => selectedRows.has(rowKey(row, i)));
  }, [rows, selectedRows, rowKey]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-dashed border-error/30">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-error">error</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900">Failed to load data</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6 text-center max-w-xs">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!isLoading && !error && filteredRows.length === 0) {
    return (
      <EmptyState
        title={emptyState?.title || "No data found"}
        description={emptyState?.description || "There are no records to display at this time."}
        action={emptyState?.action}
      />
    );
  }

  const allCurrentSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row, i) => selectedRows.has(rowKey(row, i)));

  return (
    <div className={`space-y-4 ${className}`}>
      {(searchable || selectable) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          )}

          {selectable && selectedRows.size > 0 && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-2">{selectedRows.size} selected</span>
              {bulkActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => action.onClick(selectedRowData)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    action.variant === "danger"
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur">
            <tr>
              {selectable && (
                <th className="w-12 border-b border-slate-200 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  style={column.width ? { width: column.width } : undefined}
                  className={`whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold normal-case tracking-[0.14em] text-slate-500 ${
                    sortable && column.sortable !== false
                      ? "cursor-pointer select-none hover:text-slate-700"
                      : ""
                  } ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      column.align === "right"
                        ? "justify-end"
                        : column.align === "center"
                          ? "justify-center"
                          : "justify-start"
                    }`}
                  >
                    {column.label}
                    {sortable &&
                      column.sortable !== false &&
                      sort.key === column.key && (
                        <span className="material-symbols-outlined text-base">
                          {sort.direction === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th className="w-px border-b border-slate-200 px-4 py-3.5 text-xs font-semibold normal-case tracking-[0.14em] text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row, rowIndex) => {
              const id = rowKey(row, rowIndex);
              const isSelected = selectedRows.has(id);
              return (
                <tr
                  key={String(id)}
                  onClick={() => onRowClick?.(row)}
                  className={`group transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                >
                  {selectable && (
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={column.width ? { width: column.width } : undefined}
                      className={`px-3 py-2.5 text-[13px] text-slate-700 ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {rowActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleRowAction(action, row)}
                            title={action.label}
                            className={`rounded-lg p-1.5 transition-colors ${
                              action.variant === "danger"
                                ? "text-slate-400 hover:bg-red-50 hover:text-red-500"
                                : action.variant === "primary"
                                  ? "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{action.icon}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                  p === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmAction}
        title={
          confirmAction
            ? typeof confirmAction.action.confirmTitle === "function"
              ? confirmAction.action.confirmTitle(confirmAction.row)
              : confirmAction.action.confirmTitle || "Confirm Action"
            : "Confirm Action"
        }
        message={
          confirmAction
            ? typeof confirmAction.action.confirmMessage === "function"
              ? confirmAction.action.confirmMessage(confirmAction.row)
              : confirmAction.action.confirmMessage || "Are you sure you want to proceed?"
            : "Are you sure you want to proceed?"
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmAction) {
            confirmAction.action.onClick(confirmAction.row);
            setConfirmAction(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
