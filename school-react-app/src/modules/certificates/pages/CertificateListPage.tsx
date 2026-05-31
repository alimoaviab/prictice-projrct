import { AppIcon } from "shared/ui/AppIcon";
/**
 * Certificate Management — List page showing templates and generated certificates.
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatCardCompact, Skeleton, DataState, EntityCard, EntityGrid, ConfirmModal } from "@/components/ui";
import { useCertificateTemplates, useGeneratedCertificates } from "../hooks/useCertificates";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { CERTIFICATE_TYPE_LABELS, type CertificateType, type GeneratedCertificate } from "../types/certificate.types";

type TabView = "templates" | "generated";

export function CertificateListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabView>("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { state: templateState, deleteTemplate, duplicateTemplate } = useCertificateTemplates();
  const { state: certState, revokeCertificate } = useGeneratedCertificates();
  const { schoolName } = useSchoolBranding();

  const templates = templateState.data || [];
  const certificates = certState.data || [];

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const filteredCerts = useMemo(() => {
    if (!searchQuery.trim()) return certificates;
    const q = searchQuery.toLowerCase();
    return certificates.filter(
      (c) =>
        c.student_name.toLowerCase().includes(q) ||
        c.certificate_no.toLowerCase().includes(q) ||
        c.class_name.toLowerCase().includes(q)
    );
  }, [certificates, searchQuery]);

  const stats = useMemo(() => ({
    totalTemplates: templates.length,
    totalGenerated: certificates.length,
    issued: certificates.filter((c) => c.status === "issued").length,
    revoked: certificates.filter((c) => c.status === "revoked").length,
  }), [templates, certificates]);

  const isLoading = templateState.status === "loading" || templateState.status === "idle";

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteTemplate(pendingDelete);
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCardCompact label="Templates" value={stats.totalTemplates} icon="description" accent="blue" />
          <StatCardCompact label="Generated" value={stats.totalGenerated} icon="verified" accent="emerald" />
          <StatCardCompact label="Active" value={stats.issued} icon="check_circle" accent="purple" />
          <StatCardCompact label="Revoked" value={stats.revoked} icon="cancel" accent="amber" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-sm shadow-blue-600/15">
            <AppIcon name="Award" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 normal-case truncate">
              Certificate Management
            </p>
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">
              Templates & Certificates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <AppIcon name="Search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-8 w-[180px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
            />
          </div>

          {/* Tab toggle */}
          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            {(["templates", "generated"] as TabView[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`h-7 px-3 rounded-md text-[11px] font-bold transition-colors capitalize ${
                  tab === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Create CTA */}
          <button
            type="button"
            onClick={() => navigate("/admin/certificates/create")}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
          >
            <AppIcon name="Plus" size={16} />
            New Template
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Templates Tab */}
      {!isLoading && tab === "templates" && (
        <>
          {filteredTemplates.length === 0 ? (
            <DataState
              variant="empty"
              title="No certificate templates"
              message="Create your first certificate template to start generating certificates for students."
            />
          ) : (
            <EntityGrid>
              {filteredTemplates.map((template) => (
                <EntityCard
                  key={template._id}
                  icon="description"
                  accent="blue"
                  title={template.name}
                  subtitle={CERTIFICATE_TYPE_LABELS[template.type]}
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
                    { label: "Type", value: template.type.replace("_", " ") },
                    { label: "Status", value: template.status },
                  ]}
                  actions={[
                    {
                      label: "View",
                      icon: "visibility",
                      to: `/admin/certificates/edit/${template._id}`,
                      accent: "blue",
                    },
                    {
                      label: "Edit",
                      icon: "edit",
                      to: `/admin/certificates/edit/${template._id}`,
                      accent: "blue",
                    },
                    {
                      label: "Generate",
                      icon: "print",
                      to: `/admin/certificates/generate/${template._id}`,
                      accent: "emerald",
                      primary: true,
                    },
                  ]}
                />
              ))}
            </EntityGrid>
          )}
        </>
      )}

      {/* Generated Tab */}
      {!isLoading && tab === "generated" && (
        <>
          {filteredCerts.length === 0 ? (
            <DataState
              variant="empty"
              title="No certificates generated"
              message="Select a template and generate certificates for students."
            />
          ) : (
            <EntityGrid>
              {filteredCerts.map((cert) => (
                <EntityCard
                  key={cert._id}
                  icon="verified"
                  accent={cert.status === "issued" ? "emerald" : "rose"}
                  title={cert.student_name}
                  subtitle={CERTIFICATE_TYPE_LABELS[cert.certificate_type]}
                  status={{
                    label: cert.status,
                    accent: cert.status === "issued" ? "emerald" : "rose",
                  }}
                  metrics={[
                    { label: "Class", value: cert.class_name },
                    { label: "Cert #", value: cert.certificate_no },
                    { label: "Issued", value: new Date(cert.issue_date).toLocaleDateString() },
                  ]}
                  actions={[
                    {
                      label: "View",
                      icon: "visibility",
                      to: `/admin/certificates/view/${cert._id}`,
                      accent: "blue",
                      primary: true,
                    },
                    {
                      label: "Print",
                      icon: "print",
                      onClick: () => printGeneratedCertificate(cert, schoolName),
                      accent: "blue",
                    },
                    ...(cert.status === "issued"
                      ? [
                          {
                            label: "Revoke",
                            icon: "block",
                            onClick: () => revokeCertificate(cert._id),
                            accent: "rose" as const,
                          },
                        ]
                      : []),
                  ]}
                />
              ))}
            </EntityGrid>
          )}
        </>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete this template?"
        message="This template will be permanently removed. Generated certificates using this template will not be affected."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function printGeneratedCertificate(cert: GeneratedCertificate, currentSchoolName: string) {
  const printWin = window.open("", "_blank");
  if (!printWin) return;
  const metadata = cert.metadata || {};
  const schoolName = (metadata.school_name && metadata.school_name !== "School") ? metadata.school_name : (currentSchoolName || "School");
  const body = cert.body_text || "";
  const title = CERTIFICATE_TYPE_LABELS[cert.certificate_type] || cert.certificate_type.replace("_", " ");
  const safeBody = escapeHtml(body).replace(/\n/g, "<br>");
  const issueDate = metadata.issue_date || new Date(cert.issue_date).toLocaleDateString();
  printWin.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(title)} - ${escapeHtml(cert.student_name)}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;padding:48px;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#172033}.cert{width:100%;max-width:860px;border:3px solid #d4a853;padding:56px;position:relative;text-align:center}.cert:before{content:'';position:absolute;inset:9px;border:1px solid #d4a85380}.school{font-size:28px;font-weight:bold}.school-meta{font-size:12px;color:#64748b;margin-top:4px}.title{font-size:22px;color:#1e40af;text-transform:uppercase;letter-spacing:3px;margin:22px 0;font-weight:bold}.divider{width:86px;height:2px;background:#d4a853;margin:12px auto}.body{font-size:15px;line-height:1.9;margin:30px auto;max-width:620px;color:#273449}.footer{display:flex;justify-content:space-between;gap:24px;margin-top:50px;padding-top:20px;border-top:1px solid #e5e7eb}.sig{text-align:center}.sig-line{width:132px;height:1px;background:#64748b;margin-bottom:5px}.sig-label{font-size:10px;color:#64748b;text-transform:uppercase;font-family:Arial,sans-serif}.meta{font-size:10px;color:#64748b;margin-top:4px;font-family:Arial,sans-serif}@media print{body{padding:0}.cert{min-height:100vh;border:3px solid #d4a853}}</style></head><body><div class="cert"><p class="school">${escapeHtml(schoolName)}</p><p class="school-meta">${escapeHtml(metadata.school_address || "")}${metadata.school_phone ? " | " + escapeHtml(metadata.school_phone) : ""}</p><div class="divider"></div><h1 class="title">${escapeHtml(title)}</h1><div class="divider"></div><p class="body">${safeBody}</p><div class="footer"><div class="sig"><div class="sig-line"></div><span class="sig-label">Principal</span></div><div><p class="meta">${escapeHtml(cert.certificate_no)}</p><p class="meta">${escapeHtml(cert.verification_code)}</p><p class="meta">${escapeHtml(issueDate)}</p></div><div class="sig"><div class="sig-line"></div><span class="sig-label">Class Teacher</span></div></div></div></body></html>`);
  printWin.document.close();
  setTimeout(() => printWin.print(), 300);
}
