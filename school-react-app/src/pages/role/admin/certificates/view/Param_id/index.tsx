import { SchoolShell } from "@/layouts/SchoolShell";
import { CertificateViewPage } from "@/modules/certificates/pages/CertificateViewPage";

export function AdminCertificateViewPage() {
  return (
    <SchoolShell eyebrow="Certificates" title="View Certificate">
      <CertificateViewPage />
    </SchoolShell>
  );
}
