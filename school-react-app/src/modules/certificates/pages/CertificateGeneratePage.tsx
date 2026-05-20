/**
 * Certificate Generate Page — Select students and bulk-generate certificates from a template.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, Button, Skeleton, DataState, Badge, Select, Input } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useGeneratedCertificates } from "../hooks/useCertificates";
import * as service from "../services/certificate.service";
import { CERTIFICATE_TYPE_LABELS, type CertificateTemplate } from "../types/certificate.types";
import { showToast } from "@/utils/toast";

interface StudentRow {
  _id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
  class_id: string;
  class_name?: string;
}

interface ClassRow {
  _id: string;
  name: string;
}

export function CertificateGeneratePage() {
  const { id: templateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generating, setGenerating] = useState(false);

  const { generateCertificates } = useGeneratedCertificates();

  // Load template
  const { state: templateState, run: runTemplate } = useSafeAsync<CertificateTemplate>();
  useEffect(() => {
    if (!templateId) return;
    void runTemplate(async () => {
      const result = await service.getTemplate(templateId);
      if (!result.ok) throw new Error(result.error?.message || "Failed to load template");
      return result.data;
    });
  }, [templateId, runTemplate]);

  // Load students
  const { state: studentState, run: runStudents } = useSafeAsync<StudentRow[]>();
  useEffect(() => {
    void runStudents(async () => {
      const result = await serviceRequest<StudentRow[]>("/api/students");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load students");
      return Array.isArray(result.data) ? result.data : [];
    });
  }, [runStudents]);

  // Load classes
  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  useEffect(() => {
    void runClasses(async () => {
      const result = await serviceRequest<ClassRow[]>("/api/classes");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load classes");
      return Array.isArray(result.data) ? result.data : [];
    });
  }, [runClasses]);

  const students = studentState.data || [];
  const classes = classState.data || [];

  // Load school settings for print
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();
  useEffect(() => {
    void runSettings(async () => {
      const r = await serviceRequest<any>("/api/settings");
      return r.ok ? r.data : null;
    }).catch(() => {});
  }, [runSettings]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (classFilter !== "all") {
      list = list.filter((s) => s.class_id === classFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
          s.admission_no?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, classFilter, searchQuery]);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  async function handleGenerate() {
    if (!templateId || selectedStudents.size === 0) return;
    setGenerating(true);
    try {
      const result = await generateCertificates({
        template_id: templateId,
        student_ids: Array.from(selectedStudents),
      });
      if (result && (result as any).ok !== false) {
        navigate("/admin/certificates");
      }
    } finally {
      setGenerating(false);
    }
  }

  const isLoading = templateState.status === "loading" || studentState.status === "loading";
  const template = templateState.data;

  if (templateState.status === "error") {
    return <DataState variant="error" title="Template not found" message={templateState.error} />;
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/certificates"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          Back to Certificates
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Template Info */}
          {template && (
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <span className="material-symbols-outlined text-xl">workspace_premium</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{template.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[9px]">
                      {CERTIFICATE_TYPE_LABELS[template.type]}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px]">
                      {template.orientation}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Student Selection */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Select Students</h3>
              <span className="text-[11px] font-bold text-blue-600">
                {selectedStudents.size} selected
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Classes" },
                  ...classes.map((c) => ({ value: c._id, label: c.name })),
                ]}
                className="w-full sm:w-48"
              />
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full h-9 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <Button type="button" variant="secondary" onClick={toggleAll}>
                {selectedStudents.size === filteredStudents.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Student List */}
            <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No students found</div>
              ) : (
                filteredStudents.map((student) => (
                  <label
                    key={student._id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      selectedStudents.has(student._id) ? "bg-blue-50/50" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student._id)}
                      onChange={() => toggleStudent(student._id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {student.admission_no} · {student.class_name || "—"}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </Card>

          {/* Generate & Print Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating || selectedStudents.size === 0}
              className="h-11 px-6"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base mr-2">verified</span>
                  Generate {selectedStudents.size} Certificate{selectedStudents.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (selectedStudents.size === 0 || !template) return;
                const selectedList = students.filter(s => selectedStudents.has(s._id));
                const schoolName = settingsState?.data?.profile?.school_name || "School";
                const certType = template.type.replace("_", " ");
                const printWin = window.open("", "_blank");
                if (!printWin) return;
                const certsHtml = selectedList.map((stu, idx) => `
                  <div class="cert ${idx > 0 ? 'page-break' : ''}">
                    <p class="school">${schoolName}</p>
                    <div class="divider"></div>
                    <h1 class="title">${certType}</h1>
                    <div class="divider"></div>
                    <p class="body">This is to certify that <strong>${stu.first_name} ${stu.last_name}</strong> of Class <strong>${stu.class_name || ""}</strong> has been a student of this institution.</p>
                    <div class="footer">
                      <div class="sig"><div class="sig-line"></div><span class="sig-label">Principal</span></div>
                      <div class="sig"><div class="sig-line"></div><span class="sig-label">Class Teacher</span></div>
                    </div>
                  </div>
                `).join("");
                printWin.document.write(`<!DOCTYPE html><html><head><title>Certificates</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif}.cert{width:100%;padding:60px;text-align:center;position:relative;border:3px solid #d4a853;margin:20px auto;max-width:800px}.cert::before{content:'';position:absolute;inset:8px;border:1px solid #d4a85380;border-radius:4px}.school{font-size:26px;font-weight:bold}.title{font-size:20px;color:#1e40af;text-transform:uppercase;letter-spacing:3px;margin:20px 0;font-weight:bold}.divider{width:80px;height:2px;background:#d4a853;margin:10px auto}.body{font-size:14px;line-height:1.8;margin:30px auto;max-width:500px;color:#333}.footer{display:flex;justify-content:space-between;margin-top:40px;padding-top:20px;border-top:1px solid #eee}.sig{text-align:center}.sig-line{width:120px;height:1px;background:#666;margin-bottom:4px}.sig-label{font-size:10px;color:#666;text-transform:uppercase}.page-break{page-break-before:always}@media print{body{padding:0}.cert{border:3px solid #d4a853;margin:0;page-break-inside:avoid}}</style></head><body>${certsHtml}</body></html>`);
                printWin.document.close();
                setTimeout(() => printWin.print(), 300);
              }}
              disabled={selectedStudents.size === 0}
              className="h-11 px-6"
            >
              <span className="material-symbols-outlined text-base mr-2">print</span>
              Print {selectedStudents.size} Certificate{selectedStudents.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
