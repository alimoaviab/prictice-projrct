import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppIcon } from "shared/ui/AppIcon";
import { StatCardCompact, Skeleton, DataState, EntityCard, EntityGrid, ConfirmModal } from "@/components/ui";
import { useCertificateTemplates } from "@/modules/certificates/hooks/useCertificates";
import { CERTIFICATE_TYPE_LABELS, type CertificateTemplate } from "@/modules/certificates/types/certificate.types";
import { FileText, Plus, Search, Sparkles, CreditCard, Award, HelpCircle } from "lucide-react";

type TemplateFilterTab = "all" | "certificates" | "fees" | "results" | "admission";

export function TemplateHubPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TemplateFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { state: templateState, deleteTemplate, duplicateTemplate } = useCertificateTemplates();

  const templates = templateState.data || [];
  const isLoading = templateState.status === "loading" || templateState.status === "idle";

  // Filter list by tab and search
  const filteredTemplates = useMemo(() => {
    let list = templates;

    if (tab === "certificates") {
      list = list.filter((t) => (t.type as string) !== "fee_challan" && (t.type as string) !== "result_card" && (t.type as string) !== "admission_form");
    } else if (tab === "fees") {
      list = list.filter((t) => (t.type as string) === "fee_challan");
    } else if (tab === "results") {
      list = list.filter((t) => (t.type as string) === "result_card");
    } else if (tab === "admission") {
      list = list.filter((t) => (t.type as string) === "admission_form");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, tab, searchQuery]);

  const stats = useMemo(() => ({
    total: templates.length,
    certificates: templates.filter((t) => (t.type as string) !== "fee_challan" && (t.type as string) !== "result_card" && (t.type as string) !== "admission_form").length,
    fees: templates.filter((t) => (t.type as string) === "fee_challan").length,
    results: templates.filter((t) => (t.type as string) === "result_card").length,
    admission: templates.filter((t) => (t.type as string) === "admission_form").length,
  }), [templates]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteTemplate(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6 pb-12 px-4 max-w-7xl mx-auto py-6">

      {/* Stats row */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCardCompact label="Total Templates" value={stats.total} icon="description" accent="blue" />
          <StatCardCompact label="Certificates & IDs" value={stats.certificates} icon="award" accent="emerald" />
          <StatCardCompact label="Fee Challans" value={stats.fees} icon="receipt_long" accent="purple" />
          <StatCardCompact label="Result Cards" value={stats.results} icon="assignment" accent="amber" />
          <StatCardCompact label="Admission Forms" value={stats.admission} icon="inventory" accent="rose" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-md shadow-blue-600/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Template Studio
            </p>
            <p className="text-xs font-bold text-slate-800">
              Manage Custom Layouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search layouts..."
              className="h-8 w-[180px] rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-[11px] outline-none transition-all focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-700 font-medium"
            />
          </div>

          {/* Type filters */}
          <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {(
              [
                { id: "all", label: "All" },
                { id: "certificates", label: "Certificates" },
                { id: "fees", label: "Challans" },
                { id: "results", label: "Results" },
                { id: "admission", label: "Admission" }
              ] as { id: TemplateFilterTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`h-7 px-3 rounded-md text-[10px] font-bold transition-all ${
                  tab === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* New template button */}
          <button
            type="button"
            onClick={() => navigate("/admin/templates/create")}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/10 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Template
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Templates List */}
      {!isLoading && (
        <>
          {filteredTemplates.length === 0 ? (
            <DataState
              variant="empty"
              title="No templates found"
              message="Create a new visual layout using the Canva-style Template Designer."
            />
          ) : (
            <EntityGrid>
              {filteredTemplates.map((template) => {
                const isFee = (template.type as string) === "fee_challan";
                const isResult = (template.type as string) === "result_card";
                const isAdmit = (template.type as string) === "admission_form";
                
                let linkPath = `/admin/templates/edit/${template._id}`;
                let label = CERTIFICATE_TYPE_LABELS[template.type as keyof typeof CERTIFICATE_TYPE_LABELS] || template.type.replace("_", " ");
                let accentColor: "blue" | "purple" | "emerald" | "amber" | "rose" = "blue";
                
                if (isFee) {
                  accentColor = "purple";
                  label = "Fee Challan Bill";
                } else if (isResult) {
                  accentColor = "amber";
                  label = "Academic Result Card";
                } else if (isAdmit) {
                  accentColor = "rose";
                  label = "Admission Intake Form";
                } else if ((template.type as string) === "id_card") {
                  accentColor = "emerald";
                  label = "Student ID Card";
                }

                return (
                  <EntityCard
                    key={template._id}
                    icon={isFee ? "receipt_long" : isResult ? "assignment" : "award"}
                    accent={accentColor}
                    title={template.name}
                    subtitle={label}
                    status={{
                      label: template.orientation,
                      accent: template.orientation === "landscape" ? "blue" : "purple",
                    }}
                    hoverActions={[
                      {
                        label: "Duplicate",
                        icon: "content_copy",
                        onClick: () => duplicateTemplate(template._id),
                        accent: "blue",
                      },
                      {
                        label: "Delete",
                        icon: "delete",
                        onClick: () => setPendingDelete(template._id),
                        accent: "rose",
                      },
                    ]}
                    metrics={[
                      { label: "Format", value: template.orientation },
                      { label: "Status", value: template.status },
                    ]}
                    actions={[
                      {
                        label: "Edit Layout",
                        icon: "edit",
                        to: linkPath,
                        accent: "blue",
                        primary: true,
                      },
                      ...(isFee 
                        ? [{
                            label: "Go to Fees",
                            icon: "payments",
                            to: "/admin/fee",
                            accent: "purple" as const,
                          }]
                        : isResult 
                        ? [{
                            label: "Go to Results",
                            icon: "assessment",
                            to: "/admin/results",
                            accent: "amber" as const,
                          }]
                        : [{
                            label: "Generate Documents",
                            icon: "print",
                            to: `/admin/certificates/generate/${template._id}`,
                            accent: "emerald" as const,
                          }]
                      )
                    ]}
                  />
                );
              })}
            </EntityGrid>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete this template?"
        message="Are you sure you want to permanently remove this canvas design layout? All dynamic values will be deleted."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
export default TemplateHubPage;
