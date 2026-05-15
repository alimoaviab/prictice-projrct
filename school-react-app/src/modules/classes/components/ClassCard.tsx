/**
 * Class card. Renders the canonical "master" card layout via EntityCard.
 *
 * The earlier hand-rolled markup that lived here is now the design
 * reference for every other module — see /components/ui/EntityCard.tsx.
 */

import { ClassRow } from "../types/class.types";
import { EntityCard, EntityCardAction } from "@/components/ui";

interface ClassCardProps {
  classItem: ClassRow;
  onEdit: (item: ClassRow) => void;
  onDelete: (item: ClassRow) => void;
  onFee: (item: ClassRow) => void;
}

export function ClassCard({ classItem, onEdit, onDelete, onFee }: ClassCardProps) {
  const isActive = classItem.status === "active";
  const studentCount = classItem.enrolled_students || classItem.student_count || 0;

  const actions: EntityCardAction[] = [
    {
      label: "Attend",
      icon: "fact_check",
      to: `/admin/attendance?class_id=${classItem._id}`,
      accent: "blue",
      primary: true,
    },
    {
      label: "Schedule",
      icon: "calendar_view_week",
      to: `/admin/timetable?class_id=${classItem._id}`,
      accent: "emerald",
      primary: true,
    },
    {
      label: "Fees",
      icon: "account_balance_wallet",
      onClick: () => onFee(classItem),
      accent: "violet",
      primary: true,
    },
  ];

  return (
    <EntityCard
      icon="door_front"
      accent={isActive ? "blue" : "slate"}
      title={classItem.name}
      subtitle={classItem.academic_year || "2024-25"}
      status={
        isActive ? { label: "Active", accent: "emerald" } : undefined
      }
      hoverActions={[
        {
          label: "Edit class",
          icon: "edit",
          onClick: () => onEdit(classItem),
          accent: "blue",
        },
        {
          label: "Delete class",
          icon: "delete",
          onClick: () => onDelete(classItem),
          accent: "rose",
        },
      ]}
      metrics={[
        {
          label: "Incharge",
          value: classItem.class_teacher?.name?.split(" ")[0] || "None",
        },
        {
          label: "Section",
          value: classItem.section || "General",
        },
        {
          label: "Attendance",
          value: `${classItem.attendance_percentage || 0}%`,
          tone: "text-blue-600",
        },
        {
          label: "Fees",
          value: `${(classItem as any).fee_status || 0}%`,
          tone: "text-emerald-600",
        },
      ]}
      context={{
        label: `${studentCount} Std`,
        icon: (
          <div className="flex -space-x-1.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[7px] font-black text-slate-400"
              >
                {i}
              </div>
            ))}
          </div>
        ),
        to: `/admin/students?class_id=${classItem._id}`,
      }}
      actions={actions}
    />
  );
}
