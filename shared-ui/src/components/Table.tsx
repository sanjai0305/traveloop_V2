import React from "react";
import Card from "./Card";

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  mobileLabel?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found.",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <Card hoverable={false} className="p-8 text-center text-slate-500 text-xs">
        {emptyMessage}
      </Card>
    );
  }

  return (
    <div>
      {/* Desktop/Tablet Table View (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-poppins"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((item, rowIdx) => (
              <tr
                key={keyExtractor(item, rowIdx)}
                className="hover:bg-slate-900/20 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-5 py-3 text-xs text-slate-300">
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Hidden on Desktop) */}
      <div className="block md:hidden space-y-3">
        {data.map((item, rowIdx) => (
          <Card
            key={keyExtractor(item, rowIdx)}
            hoverable={true}
            className="p-4 space-y-2 border-slate-850"
          >
            {columns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="flex justify-between items-start gap-4 text-xs"
              >
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {col.mobileLabel || col.header}
                </span>
                <span className="text-slate-300 text-right font-medium">
                  {col.accessor(item)}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Table;
