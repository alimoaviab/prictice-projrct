import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { showToast } from "@/utils/toast";
import { Card } from "@/components/ui";
import { AttendanceBulkForm } from "../components/AttendanceBulkForm";

export function AttendanceCreatePage() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [search] = useSearchParams();
  const preselectedClass = search?.get("class_id") ?? "";

  function handleSaved() {
    showToast("Attendance saved successfully", "success");

  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Roster Attendance Control</h2>
        <p className="text-sm font-medium text-slate-500">
          Rapidly verify student presence, manage absences, and track lateness across the institution.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <AttendanceBulkForm initialClassId={preselectedClass} onSaved={handleSaved} />
      </Card>
    </div>
  );
}
