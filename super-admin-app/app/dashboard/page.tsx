"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlatformShell } from "../../layouts/PlatformShell";

type Stats = {
  totalSchools: number;
  pendingSchools: number;
  approvedSchools: number;
  rejectedSchools: number;
  suspendedSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats", { credentials: "include" });
      const json = await res.json();
      if (json.ok && json.data) {
        setStats({
          totalSchools: json.data.totalSchools || 0,
          pendingSchools: json.data.pendingSchools || 0,
          approvedSchools: json.data.approvedSchools || 0,
          rejectedSchools: json.data.rejectedSchools || 0,
          suspendedSchools: json.data.suspendedSchools || 0,
          totalStudents: json.data.totalStudents || 0,
          totalTeachers: json.data.totalTeachers || 0,
          totalRevenue: json.data.totalRevenue || 0,
          monthlyRevenue: json.data.monthlyRevenue || 0,
          activeUsers: json.data.activeUsers || (json.data.totalStudents + json.data.totalTeachers) || 0,
        });
      } else {
        setError(json.message || "Failed to load stats");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: "Total Schools",
          value: stats.totalSchools,
          icon: "school",
          color: "blue",
          href: "/schools",
        },
        {
          label: "Pending Approval",
          value: stats.pendingSchools,
          icon: "pending_actions",
          color: "amber",
          href: "/schools?status=pending",
          urgent: stats.pendingSchools > 0,
        },
        {
          label: "Approved",
          value: stats.approvedSchools,
          icon: "verified",
          color: "emerald",
          href: "/schools?status=approved",
        },
        {
          label: "Suspended",
          value: stats.suspendedSchools,
          icon: "block",
          color: "red",
          href: "/schools?status=suspended",
        },
        {
          label: "Total Students",
          value: stats.totalStudents.toLocaleString(),
          icon: "groups",
          color: "indigo",
        },
        {
          label: "Total Teachers",
          value: stats.totalTeachers.toLocaleString(),
          icon: "badge",
          color: "purple",
        },
        {
          label: "Total Revenue",
          value: `PKR ${stats.totalRevenue.toLocaleString()}`,
          icon: "account_balance_wallet",
          color: "emerald",
        },
        {
          label: "Monthly Revenue",
          value: `PKR ${stats.monthlyRevenue.toLocaleString()}`,
          icon: "trending_up",
          color: "emerald",
        },
        {
          label: "Active Users",
          value: stats.activeUsers.toLocaleString(),
          icon: "person",
          color: "blue",
        },
      ]
    : [];

  const colorStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      icon: "text-blue-600",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      icon: "text-amber-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      icon: "text-emerald-600",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      icon: "text-red-600",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-100",
      icon: "text-indigo-600",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-100",
      icon: "text-purple-600",
    },
  };

  return (
    <PlatformShell eyebrow="Enterprise Control" title="Platform Dashboard">
      <div className="space-y-5">
        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg shadow-blue-600/20">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Welcome back, Super Admin
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              {stats && stats.pendingSchools > 0
                ? `You have ${stats.pendingSchools} school${stats.pendingSchools > 1 ? "s" : ""} waiting for approval`
                : "All schools are up to date"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/schools?status=pending"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-sm border border-white/20"
            >
              <span className="material-symbols-outlined text-[16px]">pending_actions</span>
              Review Pending
            </Link>
            <Link
              href="/schools"
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              All Schools
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center">
            <span className="material-symbols-outlined text-red-500 text-[40px]">error</span>
            <h3 className="text-sm font-bold text-red-900 mt-2">Error Loading Stats</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              onClick={loadStats}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map((card) => {
              const style = colorStyles[card.color] || colorStyles.blue;
              const CardContent = (
                <div
                  className={`premium-card p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer ${
                    card.urgent ? "ring-2 ring-amber-400 ring-offset-2" : ""
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center flex-shrink-0`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${style.icon}`}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {card.label}
                    </p>
                    <p className="text-lg font-bold text-slate-900 truncate">
                      {card.value}
                    </p>
                  </div>
                  {card.urgent && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                      <span className="text-[9px] font-bold text-amber-700 uppercase">
                        New
                      </span>
                    </div>
                  )}
                </div>
              );

              return card.href ? (
                <Link key={card.label} href={card.href}>
                  {CardContent}
                </Link>
              ) : (
                <div key={card.label}>{CardContent}</div>
              );
            })}
          </div>
        )}

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Revenue Overview</h3>
              <Link
                href="/revenue"
                className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
              >
                View Details →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Total Revenue
                  </p>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    PKR {stats?.totalRevenue.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">
                    account_balance_wallet
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    This Month
                  </p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    PKR {stats?.monthlyRevenue.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">trending_up</span>
                </div>
              </div>
            </div>
          </div>

          {/* School Status Distribution */}
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">School Distribution</h3>
              <Link
                href="/schools"
                className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-2">
              {stats &&
                [
                  {
                    label: "Approved",
                    value: stats.approvedSchools,
                    color: "emerald",
                    percentage: stats.totalSchools
                      ? (stats.approvedSchools / stats.totalSchools) * 100
                      : 0,
                  },
                  {
                    label: "Pending",
                    value: stats.pendingSchools,
                    color: "amber",
                    percentage: stats.totalSchools
                      ? (stats.pendingSchools / stats.totalSchools) * 100
                      : 0,
                  },
                  {
                    label: "Suspended",
                    value: stats.suspendedSchools,
                    color: "red",
                    percentage: stats.totalSchools
                      ? (stats.suspendedSchools / stats.totalSchools) * 100
                      : 0,
                  },
                  {
                    label: "Rejected",
                    value: stats.rejectedSchools,
                    color: "slate",
                    percentage: stats.totalSchools
                      ? (stats.rejectedSchools / stats.totalSchools) * 100
                      : 0,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.color === "emerald"
                            ? "bg-emerald-500"
                            : item.color === "amber"
                            ? "bg-amber-500"
                            : item.color === "red"
                            ? "bg-red-500"
                            : "bg-slate-400"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
