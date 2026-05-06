import type { ReactNode } from "react";

export type ColumnAlign = "left" | "right" | "center";

export interface DataTableColumn<T> {
  /** Stable id, used for the React key on header + cells */
  id: string;
  header: ReactNode;
  align?: ColumnAlign;
  /** Cell renderer — receives the row */
  cell: (row: T) => ReactNode;
  /** Optional extra classes applied to every cell in this column */
  cellClassName?: string;
  /** Optional extra classes applied to the header cell */
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered as a single full-width row when `rows` is empty. */
  emptyMessage: ReactNode;
  /** Optional per-row className (e.g. for selection highlighting). */
  rowClassName?: (row: T) => string;
}

const alignClass: Record<ColumnAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Column-driven table — define columns once, get a consistent layout.
 *
 * Header row, hover state, empty state, and dark-mode styling are baked in so
 * every list page renders identically. Custom rendering goes through `cell`.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`py-3 px-4 font-medium text-gray-500 dark:text-gray-400 ${alignClass[col.align ?? "left"]} ${col.headerClassName ?? ""}`.trim()}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${rowClassName?.(row) ?? ""}`.trim()}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`py-3 px-4 ${alignClass[col.align ?? "left"]} ${col.cellClassName ?? ""}`.trim()}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-gray-400 dark:text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
