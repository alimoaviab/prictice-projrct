export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({ columns, rows, className = "" }: { columns: DataTableColumn<T>[]; rows: T[]; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-border bg-surface ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-border"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 text-sm text-gray-600"
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
