import { AppIcon } from "shared/ui/AppIcon";
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
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { getThemeLayoutHTML } from "../utils/themeHelper";

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

  // Load school branding
  const { schoolName: brandedSchoolName, logoUrl: brandedLogoUrl, isLoading: brandingLoading } = useSchoolBranding();

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
          <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
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
                  <AppIcon name="Award" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{template.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[9px]">
                      {CERTIFICATE_TYPE_LABELS[template.type as keyof typeof CERTIFICATE_TYPE_LABELS] || template.type}
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
                <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                  <AppIcon name="CheckCircle" size={16} className="mr-2" />
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
                const schoolName = brandedSchoolName || "School";
                const logoUrl = brandedLogoUrl;
                
                // Parse custom styles
                let styles = {
                  primaryColor: "#d4a853",
                  titleColor: "#1e40af",
                  bodyColor: "#334155",
                  headingFont: "Cinzel",
                  recipientFont: "Great Vibes",
                  bodyFont: "EB Garamond",
                  themeLayout: "classic",
                };
                if (template.border_style) {
                  try {
                    const parsed = JSON.parse(template.border_style);
                    if (parsed && typeof parsed === "object") {
                      styles = {
                        primaryColor: parsed.primaryColor || styles.primaryColor,
                        titleColor: parsed.titleColor || styles.titleColor,
                        bodyColor: parsed.bodyColor || styles.bodyColor,
                        headingFont: parsed.headingFont || styles.headingFont,
                        recipientFont: parsed.recipientFont || styles.recipientFont,
                        bodyFont: parsed.bodyFont || styles.bodyFont,
                        themeLayout: parsed.themeLayout || styles.themeLayout,
                      };
                    }
                  } catch (e) {}
                }

                const certType = CERTIFICATE_TYPE_LABELS[template.type as keyof typeof CERTIFICATE_TYPE_LABELS] || template.type.replace("_", " ");
                const logoHtml = logoUrl
                  ? `<img src="${logoUrl}" alt="Logo" style="height: 50px; max-width: 120px; object-fit: contain; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />`
                  : `<div style="height: 48px; width: 48px; border-radius: 50%; background-color: ${styles.titleColor}; color: #fff; font-family: sans-serif; font-size: 20px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; box-shadow: 0 3px 6px rgba(0,0,0,0.1);">${schoolName.charAt(0).toUpperCase()}</div>`;

                const getPrintLayoutHTML = (layout: string, colors: typeof styles) => getThemeLayoutHTML(layout, colors);

                const printWin = window.open("", "_blank");
                if (!printWin) return;
                const certsHtml = selectedList.map((stu, idx) => {
                  const className = classes.find(c => c._id === stu.class_id)?.name || "";
                  const certNo = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                  
                  let body = template.body_text || "This is to certify that {{student_name}} of Class {{class}} has been a student of {{school_name}}.";
                  
                  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                  const studentSpan = `<span style="font-family: '${styles.recipientFont}', cursive; font-size: 1.5em; color: ${styles.titleColor}; display: inline-block; font-weight: normal; line-height: 1; vertical-align: middle;">${stu.first_name} ${stu.last_name}</span>`;
                  
                  const meta: Record<string, string> = {
                    student_name: studentSpan,
                    class: className,
                    class_name: className,
                    school_name: schoolName,
                    certificate_type: certType,
                    issue_date: dateStr,
                    year: String(new Date().getFullYear()),
                    certificate_no: certNo,
                    admission_no: stu.admission_no || "",
                    registration_no: stu.admission_no || "",
                  };
                  
                  Object.entries(meta).forEach(([key, val]) => {
                    body = body.replace(new RegExp(`{{${key}}}`, "g"), val);
                  });

                  return `
                    <div class="cert ${idx > 0 ? 'page-break' : ''}">
                      ${getPrintLayoutHTML(styles.themeLayout, styles)}
                      ${logoHtml}
                      <p class="school">${schoolName}</p>
                      <div class="divider"></div>
                      <h1 class="title">${certType}</h1>
                      <div class="divider"></div>
                      <p class="body">${body}</p>
                      <div class="footer">
                        <div class="sig"><div class="sig-line"></div><span class="sig-label">Principal</span></div>
                        <div class="sig"><div class="sig-line"></div><span class="sig-label">Class Teacher</span></div>
                      </div>
                    </div>
                  `;
                }).join("");
                printWin.document.write(`<!DOCTYPE html><html><head><title>Certificates</title><style>@import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Great+Vibes&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Tangerine:wght@400;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;padding:40px;display:flex;align-items:center;justify-content:center;min-height:100vh;background-color:#f8fafc}.cert{width:100%;padding:60px;text-align:center;position:relative;margin:20px auto;max-width:800px;background:#fff;box-shadow:0 10px 25px rgba(0,0,0,0.05);border-radius:12px;aspect-ratio:1.414/1}.school{font-size:26px;font-weight:bold;color:${styles.titleColor};font-family:'${styles.headingFont}', serif}.title{font-size:20px;color:${styles.titleColor};font-family:'${styles.headingFont}', serif;text-transform:uppercase;letter-spacing:3px;margin:20px 0;font-weight:bold}.divider{width:80px;height:2px;background:${styles.primaryColor};margin:10px auto}.body{font-size:14px;line-height:1.8;margin:30px auto;max-width:500px;color:${styles.bodyColor};font-family:'${styles.bodyFont}', serif}.footer{display:flex;justify-content:space-between;margin-top:40px;padding-top:10px;border-top:none}.sig{text-align:center}.sig-line{width:100px;height:1px;background:${styles.primaryColor};margin-bottom:4px}.sig-label{font-size:10px;color:#94a3b8;text-transform:uppercase;font-family:sans-serif;letter-spacing:1px;font-weight:bold}.page-break{page-break-before:always}@media print{body{padding:0;background-color:#fff}.cert{margin:0;box-shadow:none;border-radius:0;page-break-inside:avoid}}</style></head><body>${certsHtml}</body></html>`);
                printWin.document.close();
                setTimeout(() => printWin.print(), 300);
              }}
              disabled={selectedStudents.size === 0}
              className="h-11 px-6"
            >
              <AppIcon name="Printer" size={16} className="mr-2" />
              Print {selectedStudents.size} Certificate{selectedStudents.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
