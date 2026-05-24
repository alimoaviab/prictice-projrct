import { AppIcon } from "shared/ui/AppIcon";
import type { ReactNode } from "react";

export interface ToolbarFilterOption {
  value: string;
  label: string;
}

export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions,
  rightSlot,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: ToolbarFilterOption[];
  rightSlot?: ReactNode;
}) {
  return (
    <div className="card-compact premium-card border-slate-200">
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12 md:items-center">
        <div className="relative md:col-span-6">
          <AppIcon name="Search" size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>

        <div className="md:col-span-3">
          {filterOptions && onFilterChange ? (
            <select
              value={filterValue}
              onChange={(event) => onFilterChange(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-600/10"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="md:col-span-3 md:justify-self-end">{rightSlot}</div>
      </div>
    </div>
  );
}
