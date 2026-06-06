import { AppIcon } from "shared/ui/AppIcon";
/**
 * Certificate View Page — Shows generated certificate with print.
 */
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Skeleton, DataState, Badge, Button } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { CERTIFICATE_TYPE_LABELS, type GeneratedCertificate } from "../types/certificate.types";

import { getThemeLayoutHTML } from "../utils/themeHelper";

function renderThemeLayout(layout: string, styles: { primaryColor: string, titleColor: string, bodyColor: string }) {
  return <div dangerouslySetInnerHTML={{ __html: getThemeLayoutHTML(layout, styles) }} className="absolute inset-0 pointer-events-none" />;
}

export function CertificateViewPage() {
  const { id } = useParams<{ id: string }>();
  const { schoolName, logoUrl } = useSchoolBranding();
  const { state, run } = useSafeAsync<GeneratedCertificate>();

  useEffect(() => {
    if (!id) return;
    void run(async () => {
      const result = await serviceRequest<any>("/api/certificates");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load");
      const certs = Array.isArray(result.data) ? result.data : result.data?.data || [];
      const cert = certs.find((c: any) => c._id === id);
      if (!cert) throw new Error("Certificate not found");
      return cert;
    });
  }, [id, run]);

  const resolvedSchoolName = schoolName || "School";
  const resolvedLogoUrl = logoUrl;

  if (state.status === "loading" || state.status === "idle") {
    return <div className="space-y-4"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-[500px] w-full rounded-xl" /></div>;
  }
  if (state.status === "error") {
    return <DataState variant="error" title="Certificate not found" message={state.error} />;
  }

  const cert = state.data!;
  const typeLabel = CERTIFICATE_TYPE_LABELS[cert.certificate_type as keyof typeof CERTIFICATE_TYPE_LABELS] || cert.certificate_type;
  
  const metadata = cert.metadata || {};
  let styles = {
    primaryColor: "#d4a853",
    titleColor: "#1e40af",
    bodyColor: "#334155",
    headingFont: "Cinzel",
    recipientFont: "Great Vibes",
    bodyFont: "EB Garamond",
    themeLayout: "classic",
  };
  if (metadata.border_style) {
    try {
      const parsed = JSON.parse(metadata.border_style);
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

  const rawBodyText = cert.body_text || `This is to certify that ${cert.student_name} of Class ${cert.class_name} has been a student of ${resolvedSchoolName}. This certificate is issued on ${new Date(cert.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`;
  const studentSpan = `<span style="font-family: '${styles.recipientFont}', cursive; font-size: 1.5em; color: ${styles.titleColor}; display: inline-block; font-weight: normal; line-height: 1; vertical-align: middle;">${cert.student_name}</span>`;
  const formattedBodyText = rawBodyText.replace(new RegExp(cert.student_name, "g"), studentSpan);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/admin/certificates" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group">
          <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Certificates
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={cert.status === "issued" ? "primary" : "secondary"}>{cert.status}</Badge>
          <Button variant="secondary" onClick={() => window.print()}>
            <AppIcon name="Printer" size={14} className="mr-1" />
            Print Certificate
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs print:hidden">
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Student</p><p className="font-bold text-slate-900">{cert.student_name}</p></div>
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Class</p><p className="font-bold text-slate-900">{cert.class_name}</p></div>
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Certificate #</p><p className="font-bold text-slate-900">{cert.certificate_no}</p></div>
        <div><p className="text-[9px] font-bold text-slate-400 uppercase">Issued</p><p className="font-bold text-slate-900">{new Date(cert.issue_date).toLocaleDateString()}</p></div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden print:border-0 print:shadow-none print:rounded-none aspect-[1.414/1]">
        <div className="relative w-full h-full p-8 md:p-12 flex flex-col print:p-16">
          {renderThemeLayout(styles.themeLayout, styles)}

          <div className="text-center mb-6 relative z-10 pt-2 px-8">
            {resolvedLogoUrl ? (
              <img src={resolvedLogoUrl} alt="Logo" className="h-12 mx-auto object-contain mb-2" />
            ) : (
              <div 
                className="h-12 w-12 mx-auto rounded-full flex items-center justify-center text-white text-base font-bold mb-2 shadow-md"
                style={{ backgroundColor: styles.titleColor }}
              >
                {resolvedSchoolName.charAt(0).toUpperCase()}
              </div>
            )}
            <h3 
              className="text-xl font-bold tracking-wider"
              style={{ color: styles.titleColor, fontFamily: `'${styles.headingFont}', serif` }}
            >
              {resolvedSchoolName}
            </h3>
          </div>

          <div className="text-center mb-6 relative z-10">
            <h2 
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: styles.titleColor, fontFamily: `'${styles.headingFont}', serif` }}
            >
              {typeLabel}
            </h2>
            <div className="mt-2 mx-auto w-24 h-0.5 rounded-full" style={{ backgroundColor: styles.primaryColor }} />
          </div>

          <div className="flex-1 relative z-10 flex items-center justify-center">
            <div className="text-center max-w-lg">
              <p 
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: styles.bodyColor, fontFamily: `'${styles.bodyFont}', sans-serif` }}
                dangerouslySetInnerHTML={{ __html: formattedBodyText }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between mt-6 px-8 relative z-10">
            <div className="text-center"><div className="w-24 h-px mb-1" style={{ backgroundColor: styles.primaryColor }} /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Principal</p></div>
            <div className="text-center"><p className="text-[7px] text-slate-400 font-mono">{cert.certificate_no}</p><p className="text-[7px] text-slate-400 font-mono">Code: {cert.verification_code}</p></div>
            <div className="text-center"><div className="w-24 h-px mb-1" style={{ backgroundColor: styles.primaryColor }} /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Teacher</p></div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <span className="text-[100px] font-black text-slate-900 rotate-[-30deg] whitespace-nowrap">{resolvedSchoolName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
