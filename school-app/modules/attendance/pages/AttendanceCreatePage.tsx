"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "../../../utils/toast";
import { Card } from "../../../components/ui";
import { AttendanceBulkForm } from "../components/AttendanceBulkForm";

export function AttendanceCreatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const preselectedClass = search?.get("class_id") ?? "";

  function handleSaved() {
    showToast("Attendance saved successfully", "success");
    router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={pathname.includes("/teacher") ? "/teacher/attendance" : "/admin/attendance"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Attendance
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pick a class, confirm the date, then mark the full roster in one pass.
          </p>
        </div>

        <AttendanceBulkForm initialClassId={preselectedClass} onSaved={handleSaved} />
      </Card>
    </div>
  );
}
