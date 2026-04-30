import { colors, spacing, typography } from "@edu/shared/design-system/tokens";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({ columns, rows }: { columns: DataTableColumn<T>[]; rows: T[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: colors.surfaceContainerLowest }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...typography.tableHeader,
                  color: colors.onSurfaceVariant,
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  textAlign: "left",
                  borderBottom: `1px solid ${colors.cardBorder}`
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    ...typography.bodyMd,
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    borderBottom: `1px solid ${colors.cardBorder}`
                  }}
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
