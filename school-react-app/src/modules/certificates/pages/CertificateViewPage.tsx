/**
<<<<<<< Updated upstream
 * Certificate View Page — Shows a generated certificate with print option.
 */

import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Skeleton, DataState, Badge, Button } from "@/components/ui";
=======
 * Certificate View Page — Shows generated certificate with print.
 */
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Skeleton, DataState, Badge, Button } from "@/components/ui";
>>>>>>> Stashed changes
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { CERTIFICATE_TYPE_LABELS, type GeneratedCertificate } from "../types/certificate.types";

export function CertificateViewPage() {
  const { id } = useParams<{ id: string }>();
  const { schoolName } = useSchoolBranding();
  const { state, run } = useSafeAsync<GeneratedCertificate>();
<<<<<<< Updated upstream

  // Fetch school settings
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();
=======
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();

>>>>>>> Stashed changes
  useEffect(() => {
    void runSettings(async () => {
      const r = await serviceRequest<any>("/api/settings");
      return r.ok ? r.data : null;
    }).catch(() => {});
  }, [runSettings]);

  useEffect(() => {
    if (!id) return;
    void run(async () => {
<<<<<<< Updated upstream
      // Try fetching from the certificates list and find by ID
      const result = await serviceRequest<any>("/api/certificates");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load certificate");
=======
      const result = await serviceRequest<any>("/api/certificates");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load");
>>>>>>> Stashed changes
      const certs = Array.isArray(result.data) ? result.data : result.data?.data || [];
      const cert = certs.find((c: any) => c._id === id);
      if (!cert) throw new Error("Certificate not found");
      return cert;
    });
  }, [id, run]);

  const resolvedSchoolName = settingsState.data?.profile?.school_name || schoolName || "School";

  if (state.status === "loading" || state.status === "idle") {
<<<<<<< Updated upstream
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

=======
    return <div className="space-y-4"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-[500px] w-full rounded-xl" /></div>;
  }
>>>>>>> Stashed changes
  if (state.status === "error") {
    return <DataState variant="error" title="Certificate not found" message={state.error} />;
  }

  const cert = state.data!;
  const typeLabel = CERTIFICATE_TYPE_LABELS[cert.certificate_type as keyof typeof CERTIFICATE_TYPE_LABELS] || cert.certificate_type;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
<<<<<<< Updated upstream
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/certificates"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group"
        >
=======
      <div className="flex items-center justify-between print:hidden">
        <Link to="/admin/certificates" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group">
>>>>>>> Stashed changes
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          Back to Certificates
        </Link>
        <div className="flex items-center gap-2">
<<<<<<< Updated upstream
          <Badge variant={cert.status === "issued" ? "primary" : "secondary"}>
            {cert.status}
          </Badge>
          <Button variant="secondary" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-sm mr-1">print</span>
            Print
=======
          <Badge variant={cert.status === "issued" ? "primary" : "secondary"}>{cert.status}</Badge>
          <Button variant="secondary" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-sm mr-1">print</span>
            Print Certificate
>>>>>>> Stashed changes
          </Button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Certificate Info */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Student</p>
            <p className="font-bold text-slate-900">{cert.student_name}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Class</p>
            <p className="font-bold text-slate-900">{cert.class_name}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Certificate #</p>
            <p className="font-bold text-slate-900">{cert.certificate_no}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Issued</p>
            <p className="font-bold text-slate-900">{new Date(cert.issue_date).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Certificate Preview */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden print:border-0 print:shadow-none print:rounded-none aspect-[1.414/1]">
        <div className="relative w-full h-full p-8 md:p-12 flex flex-col print:p-16">
          {/* Decorative border */}
          <div className="absolute inset-4 border-2 border-amber-300/50 rounded-lg pointer-events-none" />
          <div className="absolute inset-6 border border-amber-200/30 rounded-lg pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {resolvedSchoolName.charAt(0).toUpperCase()}
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{resolvedSchoolName}</h3>
          </div>

          {/* Certificate Title */}
=======
      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs print:hidden">
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Student</p><p className="font-bold text-slate-900">{cert.student_name}</p></div>
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Class</p><p className="font-bold text-slate-900">{cert.class_name}</p></div>
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Certificate #</p><p className="font-bold text-slate-900">{cert.certificate_no}</p></div>
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Issued</p><p className="font-bold text-slate-900">{new Date(cert.issue_date).toLocaleDateString()}</p></div>
      </div>

      {/* Certificate Preview (Printable) */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden print:border-0 print:shadow-none print:rounded-none aspect-[1.414/1]">
        <div className="relative w-full h-full p-8 md:p-12 flex flex-col print:p-16">
          <div className="absolute inset-4 border-2 border-amber-300/50 rounded-lg pointer-events-none" />
          <div className="absolute inset-6 border border-amber-200/30 rounded-lg pointer-events-none" />

          <div className="text-center mb-6 relative z-10">
            <div className="h-14 w-14 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-2">
              {resolvedSchoolName.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-black text-slate-900">{resolvedSchoolName}</h3>
          </div>

>>>>>>> Stashed changes
          <div className="text-center mb-6 relative z-10">
            <h2 className="text-2xl font-black text-blue-800 uppercase tracking-widest">{typeLabel}</h2>
            <div className="mt-2 mx-auto w-24 h-0.5 bg-amber-400 rounded-full" />
          </div>

<<<<<<< Updated upstream
          {/* Body */}
=======
>>>>>>> Stashed changes
          <div className="flex-1 relative z-10 flex items-center justify-center">
            <div className="text-center max-w-lg">
              <p className="text-sm text-slate-700 leading-relaxed">
                This is to certify that <strong>{cert.student_name}</strong> of Class <strong>{cert.class_name}</strong> has been a student of this institution.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed mt-3">
                This certificate is issued on {new Date(cert.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              </p>
            </div>
          </div>

<<<<<<< Updated upstream
          {/* Footer */}
          <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-100 relative z-10">
            <div className="text-center">
              <div className="w-28 h-px bg-slate-400 mb-1" />
              <p className="text-[10px] font-bold text-slate-500">Principal</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-slate-400 font-mono">{cert.certificate_no}</p>
              <p className="text-[8px] text-slate-400">Verification: {cert.verification_code}</p>
            </div>
            <div className="text-center">
              <div className="w-28 h-px bg-slate-400 mb-1" />
              <p className="text-[10px] font-bold text-slate-500">Class Teacher</p>
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <span className="text-[100px] font-black text-slate-900 rotate-[-30deg] whitespace-nowrap">
              {resolvedSchoolName}
            </span>
=======
          <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-100 relative z-10">
            <div className="text-center"><div className="w-28 h-px bg-slate-400 mb-1" /><p className="text-[10px] font-bold text-slate-500">Principal</p></div>
            <div className="text-center"><p className="text-[8px] text-slate-400 font-mono">{cert.certificate_no}</p><p className="text-[8px] text-slate-400">Code: {cert.verification_code}</p></div>
            <div className="text-center"><div className="w-28 h-px bg-slate-400 mb-1" /><p className="text-[10px] font-bold text-slate-500">Class Teacher</p></div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <span className="text-[100px] font-black text-slate-900 rotate-[-30deg] whitespace-nowrap">{resolvedSchoolName}</span>
>>>>>>> Stashed changes
          </div>
        </div>
      </div>
    </div>
  );
}
