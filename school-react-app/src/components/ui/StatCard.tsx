import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatCard({ title, value, icon, iconBg = "bg-blue-100", iconColor = "text-blue-600", trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`material-symbols-outlined text-sm ${trend.positive ? "text-green-600" : "text-red-600"}`}>
                {trend.positive ? "trending_up" : "trending_down"}
              </span>
              <span className={`text-xs font-semibold ${trend.positive ? "text-green-600" : "text-red-600"}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`h-11 w-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
