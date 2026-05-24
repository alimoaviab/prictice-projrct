import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, StatCardGrid } from "@/components/ui";
import { useSubjects } from "../hooks/useSubjects";
import { SubjectEditSidebar } from "../components/SubjectEditSidebar";
import { SubjectRow, SubjectFormInput } from "../types";
import { showToast } from "@/utils/toast";

export function SubjectListPage() {
  const { data, isLoading, error, createSubject, updateSubject, deleteSubject } = useSubjects();

  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  async function handleSave(id: string | null, formData: SubjectFormInput) {
    try {
      setIsSaving(true);
      if (id) {
        await updateSubject(id, formData);
        showToast("Subject updated successfully");
      } else {
        await createSubject(formData);
        showToast("Subject created successfully");
      }
      setEditingSubject(null);
      setIsAdding(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save subject");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(id);
      showToast("Subject deleted successfully");
    } catch (err: any) {
      showToast(err.message || "Failed to delete subject");
    }
  }

  const filteredRows = useMemo(() => {
    const rows = data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        (row.code || "").toLowerCase().includes(q) ||
        (row.academic_year || "").toLowerCase().includes(q) ||
        (row.teacher_name || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [data, searchQuery, statusFilter]);

  const columns: DataTableColumn<SubjectRow>[] = [
    {
      key: "name",
      label: "Subject Identity",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">{row.code || "NO-CODE"}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "academic_year",
      label: "Session",
      render: (row) => <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100">{row.academic_year || "All Sessions"}</Badge>,
    },
    {
      key: "teacher",
      label: "Faculty Head",
      render: (row) => (
        <div className="flex items-center gap-2">
           <div className="h-6 w-6 rounded-full bg-slate-900 text-[8px] font-bold text-white flex items-center justify-center normal-case">
              {(row.teacher_name || 'T').substring(0, 1)}
           </div>
           <span className="text-[11px] font-bold text-slate-600">{row.teacher_name || "Faculty Pending"}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "gray"} className="text-[9px] font-bold normal-case  px-2 py-0.5">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<SubjectRow>[] = [
    {
      icon: "settings",
      label: "Configure",
      onClick: (row) => setEditingSubject(row),
    },
    {
      icon: "delete",
      label: "Remove",
      variant: "danger",
      onClick: (row) => handleDelete(row._id),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium & Compact */}
      <StatCardGrid
        items={[
          { label: "Total Subjects", value: (data || []).length, icon: "menu_book", accent: "blue" },
          { label: "Active Curriculum", value: (data || []).filter(s => s.status === 'active').length, icon: "check_circle", accent: "emerald" },
          { 
            label: "Curriculum Depth", 
            value: Math.round((data || []).reduce((acc, s) => acc + (s.total_marks || 0), 0) / (data?.length || 1)), 
            icon: "stars", 
            accent: "amber",
            suffix: " Avg"
          },
          { 
            label: "Faculty Mapping", 
            value: Math.round(((data || []).filter(s => s.teacher_name).length / (data?.length || 1)) * 100), 
            icon: "hub", 
            accent: "purple",
            suffix: "%"
          },
        ]}
      />

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name or faculty..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Lifecycle: All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AppIcon name="LayoutGrid" size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AppIcon name="ViewList" size={16} />
              List
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">SUBJECTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <AppIcon name="PlusSquare" size={18} />
            Register Subject
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Subjects Found" 
            message={searchQuery ? "Try refining your search parameters." : "Begin building your curriculum by adding your first subject."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div
                  key={row._id}
                  className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm transition-transform group-hover:scale-110">
                        <AppIcon name="BookOpen" className="font-bold" />
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                        <button
                          onClick={() => setEditingSubject(row)}
                          title="Configure"
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                        >
                          <AppIcon name="Settings" size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(row._id)}
                          title="Remove"
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                        >
                          <AppIcon name="Trash2" size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{row.name}</h3>
                        <Badge variant={row.status === "active" ? "success" : "gray"} className="text-[8px] font-bold normal-case  px-1.5 py-0">
                          {row.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 normal-case ">
                         <span>{row.code || "NO-CODE"}</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-slate-400 normal-case ">Faculty Head</p>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-900 text-[8px] font-bold text-white flex items-center justify-center normal-case shadow-sm">
                            {(row.teacher_name || 'T').substring(0, 1)}
                          </div>
                          <p className="text-[10px] font-bold text-slate-700 truncate">
                            {row.teacher_name || "Faculty Pending"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {(row.class_mapping || ["Core Grade"]).map((cls, i) => (
                          <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-400 border-slate-100/50 text-[9px] font-bold normal-case">
                            {cls}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                    <div className="flex items-center gap-2">
                       <AppIcon name="Calendar" size={14} className="text-slate-400" />
                       <p className="text-[10px] font-bold text-slate-400 normal-case ">
                         {row.academic_year || "All Sessions"}
                       </p>
                    </div>
                    <button
                      onClick={() => setEditingSubject(row)}
                      className="group/btn h-8 px-4 rounded-lg bg-blue-600 text-[10px] font-bold text-white normal-case  hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      Manage
                      <AppIcon name="ArrowRight" size={14} className="transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
              <DataTable
                columns={columns}
                rows={filteredRows}
                rowKey={(row) => row._id}
                sortable
                paginated={10}
                rowActions={rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Real pagination is rendered by <DataTable paginated={N}> in the
          list view. */}

      <SubjectEditSidebar
        isOpen={isAdding || editingSubject !== null}
        subject={editingSubject}
        onClose={() => {
          setIsAdding(false);
          setEditingSubject(null);
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
