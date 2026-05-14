/**
 * StudentListSkeleton — skeleton for the students table/list view.
 *
 * Shows 5 rows matching the real student list layout:
 * Avatar | Name + Admission No | Class | Status | Actions
 */

export function StudentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Avatar */}
      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse shrink-0" />

      {/* Name + admission */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Class */}
      <div className="hidden md:block h-4 w-20 bg-gray-200 rounded animate-pulse" />

      {/* Section */}
      <div className="hidden lg:block h-4 w-12 bg-gray-100 rounded animate-pulse" />

      {/* Status badge */}
      <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />

      {/* Actions */}
      <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

interface StudentListSkeletonProps {
  rows?: number;
}

export function StudentListSkeleton({ rows = 5 }: StudentListSkeletonProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-3">
          {/* Search bar skeleton */}
          <div className="h-9 w-48 bg-gray-100 rounded-lg animate-pulse" />
          {/* Filter button */}
          <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
          {/* Add button */}
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table header */}
      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-4">
        <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
        <div className="flex-1 h-3 w-16 bg-gray-100 rounded animate-pulse" />
        <div className="hidden md:block h-3 w-12 bg-gray-100 rounded animate-pulse" />
        <div className="hidden lg:block h-3 w-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <StudentRowSkeleton key={i} />
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
