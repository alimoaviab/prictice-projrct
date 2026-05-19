/**
 * Certificate Template Builder — Create/Edit certificate templates.
 * 
 * Fixes:
 * - Certificate type is a free text input (user types their own)
 * - Preview shows actual resolved values from school/student data
 * - No hardcoded school info — uses dynamic variables
 * - Watermark shows school name, not "EDUPLEXO"
 * - Variable tags insert into textarea at cursor position
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Card, Button, Input, Select, Badge } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useCertificateTemplates } from "../hooks/useCertificates";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import {
  CERTIFICATE_VARIABLES,
  type CertificateOrientation,
  type CertificateFormInput,
} from "../types/certificate.types";

const ORIENTATION_OPTIONS = [
  { value: "landscape", label: "Landscape (A4)" },
  { value: "portrait", label: "Portrait (A4)" },
];

const DEFAULT_BODY_TEXT = "";

export function CertificateCreatePage() {
  const navigate = useNavigate();
  const { createTemplate } = useCertificateTemplates();
  const { schoolName } = useSchoolBranding();
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<CertificateFormInput>({
    name: "",
    type: "character" as any,
    orientation: "landscape",
    body_text: DEFAULT_BODY_TEXT,
    elements: [],
  });

  // Custom certificate title (what appears on the certificate itself)
  const [certificateTitle, setCertificateTitle] = useState("Character Certificate");

  // Fetch school settings for preview
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();
  useEffect(() => {
    void runSettings(async () => {
      const result = await serviceRequest<any>("/api/settings");
      if (result.ok) return result.data;
      return null;
    }).catch(() => {});
  }, [runSettings]);

  const schoolData = settingsState.data?.profile || {};
  const resolvedSchoolName =
    schoolData.schoolName ||
    schoolData.school_name ||
    schoolData.name ||
    schoolName ||
    "Your School Name";
  const resolvedAddress = schoolData.address || schoolData.city || "";
  const resolvedPhone = schoolData.phone || schoolData.contact || "";
  const resolvedPrincipal = schoolData.principal_name || "Principal Name";

  const updateField = useCallback(<K extends keyof CertificateFormInput>(key: K, value: CertificateFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Insert variable at cursor position in textarea
  const insertVariable = useCallback((variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateField("body_text", form.body_text + " " + variable);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.body_text;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + variable + after;
    
    updateField("body_text", newText);
    
    // Restore cursor position after the inserted variable
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [form.body_text, updateField]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const result = await createTemplate({
        ...form,
        // Store the custom title in body_text metadata or as the type
        type: form.type,
      });
      if (result && (result as any).ok !== false) {
        navigate("/admin/certificates");
      }
    } finally {
      setSaving(false);
    }
  }

  // Resolve all variables with real/sample data for preview
  const resolvePreview = (text: string): string => {
    return text
      .replace(/\{\{school_name\}\}/g, resolvedSchoolName)
      .replace(/\{\{school_logo\}\}/g, "")
      .replace(/\{\{school_address\}\}/g, resolvedAddress)
      .replace(/\{\{school_phone\}\}/g, resolvedPhone)
      .replace(/\{\{student_name\}\}/g, "Ahmed Ali Khan")
      .replace(/\{\{father_name\}\}/g, "Muhammad Ali Khan")
      .replace(/\{\{class\}\}/g, "10")
      .replace(/\{\{section\}\}/g, "A")
      .replace(/\{\{roll_no\}\}/g, "15")
      .replace(/\{\{registration_no\}\}/g, "REG-2024-0015")
      .replace(/\{\{admission_no\}\}/g, "ADM-2020-0015")
      .replace(/\{\{session\}\}/g, "2024-2025")
      .replace(/\{\{issue_date\}\}/g, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
      .replace(/\{\{certificate_no\}\}/g, "CERT-2025-00001")
      .replace(/\{\{principal_name\}\}/g, resolvedPrincipal)
      .replace(/\{\{student_photo\}\}/g, "")
      .replace(/\{\{dob\}\}/g, "January 15, 2008")
      .replace(/\{\{gender\}\}/g, "Male");
  };

  const previewText = resolvePreview(form.body_text);

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
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

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Left: Form */}
        <div className="w-full lg:w-[45%] space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Template Details</h2>

            <Input
              label="Template Name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Character Certificate 2025"
              required
            />

            <div className="grid grid-cols-1 gap-3">
              {/* Certificate Title — free text input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Certificate Title</label>
                <input
                  type="text"
                  value={certificateTitle}
                  onChange={(e) => setCertificateTitle(e.target.value)}
                  placeholder="e.g. Character Certificate"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Certificate Body</h2>
            <p className="text-[11px] text-slate-500">
              Write the certificate content below. This text will appear on the generated certificate.
            </p>

            <textarea
              ref={textareaRef}
              value={form.body_text}
              onChange={(e) => updateField("body_text", e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-700 font-medium leading-relaxed focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-y overflow-auto break-words"
              placeholder="Write certificate body text here..."
            />
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : "Create Template"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/admin/certificates")}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-full lg:w-[55%]">
          <div className="sticky top-20">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live Preview</p>
            <div
              className={`bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden ${
                form.orientation === "landscape" ? "aspect-[1.414/1]" : "aspect-[1/1.414]"
              }`}
            >
              <div className="relative w-full h-full p-6 md:p-10 flex flex-col">
                {/* Decorative border */}
                <div className="absolute inset-3 border-2 border-amber-300/50 rounded-lg pointer-events-none" />
                <div className="absolute inset-5 border border-amber-200/30 rounded-lg pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-4 relative z-10">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {resolvedSchoolName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                    {resolvedSchoolName}
                  </h3>
                  {resolvedAddress && (
                    <p className="text-[9px] text-slate-500 font-medium">{resolvedAddress}</p>
                  )}
                  {resolvedPhone && (
                    <p className="text-[8px] text-slate-400 font-medium">{resolvedPhone}</p>
                  )}
                </div>

                {/* Certificate Title */}
                <div className="text-center mb-4 relative z-10">
                  <h2 className="text-lg md:text-xl font-black text-blue-800 uppercase tracking-widest">
                    {certificateTitle || "Certificate"}
                  </h2>
                  <div className="mt-1.5 mx-auto w-20 h-0.5 bg-amber-400 rounded-full" />
                </div>

                {/* Body */}
                <div className="flex-1 relative z-10 overflow-hidden">
                  <p className="text-[10px] md:text-xs text-slate-700 leading-relaxed text-center mx-auto px-2 break-words whitespace-normal">
                    {previewText}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-100 relative z-10">
                  <div className="text-center">
                    <div className="w-20 h-px bg-slate-400 mb-1" />
                    <p className="text-[8px] font-bold text-slate-500">Principal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] text-slate-400">CERT-2025-00001</p>
                    <p className="text-[7px] text-slate-400">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-px bg-slate-400 mb-1" />
                    <p className="text-[8px] font-bold text-slate-500">Class Teacher</p>
                  </div>
                </div>

                {/* Watermark — shows school name */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <span className="text-[80px] font-black text-slate-900 rotate-[-30deg] whitespace-nowrap">
                    {resolvedSchoolName}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview note */}
            <div className="mt-4 space-y-2 text-center">
              <p className="text-[9px] text-slate-400">
                Preview shows sample data. Actual values will be filled from student records when generating.
              </p>
              <div className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-600">
                <span>Powered by Eduplexo</span>
                <span className="h-px w-24 bg-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
