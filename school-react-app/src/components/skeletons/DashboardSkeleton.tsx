/**
 * DashboardSkeleton — skeleton loading state for the admin dashboard.
 *
 * Shows 8 stat cards in a 2×4 grid (matching the real dashboard layout)
 * plus a chart area and activity feed skeleton below.
 */

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      {/* Label */}
      <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
      {/* Value */}
      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
      {/* Trend indicator */}
      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />

      {/* Stat cards: 2 rows × 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Fee collection chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
