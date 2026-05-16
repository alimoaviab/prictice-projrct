/**
 * AttendanceGridSkeleton — skeleton for the attendance marking grid.
 *
 * Mimics the real attendance view: class selector, date picker, and a grid
 * of student rows with status toggle buttons.
 */

export function AttendanceGridSkeleton() {
  return (
    <div className="space-y-5">
      {/* Controls bar: class selector + date picker */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-44 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        <div className="ml-auto h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-green-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-red-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Attendance grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Grid header */}
        <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-[1fr_auto] md:grid-cols-[40px_1fr_100px_120px] gap-4 items-center">
          <div className="hidden md:block h-3 w-6 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="hidden md:block h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Student rows with toggle buttons */}
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-3 grid grid-cols-[1fr_auto] md:grid-cols-[40px_1fr_100px_120px] gap-4 items-center"
            >
              {/* Row number */}
              <div className="hidden md:block h-4 w-6 bg-gray-100 rounded animate-pulse" />

              {/* Student name */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
                <div className="space-y-1">
                  <div
                    className="h-4 bg-gray-200 rounded animate-pulse"
                    style={{ width: `${100 + Math.random() * 60}px` }}
                  />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>

              {/* Admission no */}
              <div className="hidden md:block h-4 w-16 bg-gray-100 rounded animate-pulse" />

              {/* Status toggle buttons (Present/Absent/Late) */}
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 bg-green-100 rounded-md animate-pulse" />
                <div className="h-8 w-8 bg-red-100 rounded-md animate-pulse" />
                <div className="h-8 w-8 bg-yellow-100 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Submit button area */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
