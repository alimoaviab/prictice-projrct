import type { ReactNode } from "react";
import { StatCard } from "./StatCard";

export interface StatItem {
  title: string;
  value: string | number;
  icon: string; // material-symbols-outlined icon name
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = columns === 2
    ? "grid-cols-1 sm:grid-cols-2"
    : columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-2 md:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {stats.map((stat, i) => (
        <StatCard
          key={i}
          title={stat.title}
          value={stat.value}
          icon={<span className="material-symbols-outlined text-xl">{stat.icon}</span>}
          iconBg={stat.iconBg || "bg-blue-100"}
          iconColor={stat.iconColor || "text-blue-600"}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}
