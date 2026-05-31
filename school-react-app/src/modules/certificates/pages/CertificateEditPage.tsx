import { AppIcon } from "shared/ui/AppIcon";
/**
 * Certificate Edit Page — Edit existing template.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, Button, Input, Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { useCertificateTemplates } from "../hooks/useCertificates";
import * as service from "../services/certificate.service";
import { CERTIFICATE_VARIABLES, type CertificateTemplate } from "../types/certificate.types";
export function CertificateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateTemplate } = useCertificateTemplates();
  const { schoolName } = useSchoolBranding();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [certificateTitle, setCertificateTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBodyText((prev) => prev + " " + variable);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = bodyText;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + variable + after;
    
    setBodyText(newText);
    
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };
  const { state: templateState, run: runTemplate } = useSafeAsync<CertificateTemplate>();
  useEffect(() => {
    if (!id) return;
    void runTemplate(async () => {
      const result = await service.getTemplate(id);
      if (!result.ok) throw new Error(result.error?.message || "Failed to load template");
      return result.data;
    });
  }, [id, runTemplate]);

  useEffect(() => {
    if (templateState.data) {
      setName(templateState.data.name || "");
      setCertificateTitle(templateState.data.type || "");
      setBodyText(templateState.data.body_text || "");
    }
  }, [templateState.data]);

  const resolvedSchoolName = schoolName || "School";

  async function handleSave() {
    if (!name.trim() || !id) return;
    setSaving(true);
    try {
      const result = await updateTemplate(id, { name: name.trim(), type: certificateTitle as any, body_text: bodyText });
      if (result && (result as any).ok !== false) navigate("/admin/certificates");
    } finally { setSaving(false); }
  }

  if (templateState.status === "loading" || templateState.status === "idle") {
    return <div className="max-w-7xl mx-auto py-4 px-4 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px] w-full rounded-xl" /></div>;
  }
  if (templateState.status === "error") {
    return <DataState variant="error" title="Template not found" message={templateState.error} />;
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      <Link to="/admin/certificates" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group">
        <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Certificates
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[45%] space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Edit Template</h2>
            <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 ml-1">Certificate Title</label>
              <input type="text" value={certificateTitle} onChange={(e) => setCertificateTitle(e.target.value)} placeholder="e.g. Character Certificate" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-300" />
            </div>
          </Card>
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Certificate Body</h2>
            <p className="text-[11px] text-slate-500">
              Write the certificate content below. Click the variables to insert them. They will be replaced with real data when generating.
            </p>

            <div className="flex flex-wrap gap-1.5 py-1">
              {CERTIFICATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 transition-colors"
                  title={`Insert ${v.key}`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <textarea ref={textareaRef} value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={8} className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-700 font-medium leading-relaxed focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-y" placeholder="Write certificate body text..." />
          </Card>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Saving..." : "Save Changes"}</Button>
            <Button variant="ghost" onClick={() => navigate("/admin/certificates")}>Cancel</Button>
          </div>
        </div>

        <div className="w-full lg:w-[55%]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live Preview</p>
          <div className="bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden aspect-[1.414/1]">
            <div className="relative w-full h-full p-6 md:p-10 flex flex-col">
              <div className="absolute inset-3 border-2 border-amber-300/50 rounded-lg pointer-events-none" />
              <div className="absolute inset-5 border border-amber-200/30 rounded-lg pointer-events-none" />
              <div className="text-center mb-4 relative z-10">
                <div className="h-10 w-10 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mb-2">{resolvedSchoolName.charAt(0).toUpperCase()}</div>
                <h3 className="text-base md:text-lg font-black text-slate-900">{resolvedSchoolName}</h3>
              </div>
              <div className="text-center mb-4 relative z-10">
                <h2 className="text-lg md:text-xl font-black text-blue-800 uppercase tracking-widest">{certificateTitle || "Certificate"}</h2>
                <div className="mt-1.5 mx-auto w-20 h-0.5 bg-amber-400 rounded-full" />
              </div>
              <div className="flex-1 relative z-10 overflow-hidden">
                <p className="text-[10px] md:text-xs text-slate-700 leading-relaxed text-center max-w-md mx-auto">{bodyText || "Certificate body text..."}</p>
              </div>
              <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-100 relative z-10">
                <div className="text-center"><div className="w-20 h-px bg-slate-400 mb-1" /><p className="text-[8px] font-bold text-slate-500">Principal</p></div>
                <div className="text-center"><div className="w-20 h-px bg-slate-400 mb-1" /><p className="text-[8px] font-bold text-slate-500">Class Teacher</p></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <span className="text-[80px] font-black text-slate-900 rotate-[-30deg] whitespace-nowrap">{resolvedSchoolName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
