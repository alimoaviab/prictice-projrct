"use client";

type School = {
  school_id: string;
  name: string;
  code: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_profile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  plan?: {
    key?: string;
    seats?: number;
    expires_at?: string;
  };
  usage?: {
    users?: number;
    students?: number;
    teachers?: number;
    classes?: number;
    storage_mb?: number;
  };
  created_at: string;
};

type Props = {
  schools: School[];
  onAction: (
    type: "approve" | "reject" | "suspend" | "activate" | "delete",
    school: School
  ) => void;
};

const statusStyles: Record<string, { bg: string; text: string; icon: string }> = {
  pending: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: "pending",
  },
  approved: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: "check_circle",
  },
  rejected: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: "cancel",
  },
  suspended: {
    bg: "bg-slate-100 border-slate-300",
    text: "text-slate-700",
    icon: "block",
  },
};

const planStyles: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  basic: "bg-blue-100 text-blue-700",
  premium: "bg-purple-100 text-purple-700",
  enterprise: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800",
};

export function SchoolsTable({ schools, onAction }: Props) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50/80 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              School
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Owner / Contact
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Usage
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schools.map((school, idx) => {
            const status = statusStyles[school.status] || statusStyles.pending;
            const planKey = school.plan?.key || "free";
            const planStyle = planStyles[planKey] || planStyles.free;

            return (
              <tr
                key={school.school_id}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-4 py-3 text-xs font-bold text-slate-400">
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {school.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {school.name}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {school.code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {school.admin_profile?.name || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {school.admin_profile?.email || "—"}
                    </p>
                    {school.admin_profile?.phone && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {school.admin_profile.phone}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">
                        groups
                      </span>
                      <span className="font-bold">
                        {school.usage?.students || 0}
                      </span>
                      <span className="text-slate-400">students</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">
                        badge
                      </span>
                      <span className="font-bold">
                        {school.usage?.teachers || 0}
                      </span>
                      <span className="text-slate-400">teachers</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${planStyle}`}
                  >
                    {planKey}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {status.icon}
                    </span>
                    {school.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-600 whitespace-nowrap">
                  {formatDate(school.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {school.status === "pending" && (
                      <>
                        <button
                          onClick={() => onAction("approve", school)}
                          title="Approve"
                          className="h-7 w-7 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        </button>
                        <button
                          onClick={() => onAction("reject", school)}
                          title="Reject"
                          className="h-7 w-7 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            close
                          </span>
                        </button>
                      </>
                    )}
                    {school.status === "approved" && (
                      <button
                        onClick={() => onAction("suspend", school)}
                        title="Suspend"
                        className="h-7 px-2.5 flex items-center gap-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all border border-amber-100 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          block
                        </span>
                        Suspend
                      </button>
                    )}
                    {school.status === "suspended" && (
                      <button
                        onClick={() => onAction("activate", school)}
                        title="Activate"
                        className="h-7 px-2.5 flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          restart_alt
                        </span>
                        Activate
                      </button>
                    )}
                    {school.status === "rejected" && (
                      <button
                        onClick={() => onAction("approve", school)}
                        title="Approve"
                        className="h-7 px-2.5 flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          check
                        </span>
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() =>
                        (window.location.href = `/schools/${school.school_id}`)
                      }
                      title="View Details"
                      className="h-7 w-7 flex items-center justify-center rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        visibility
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
