import { SchoolShell } from "@/layouts/SchoolShell";
import { CertificateEditPage } from "@/modules/certificates/pages/CertificateEditPage";

export function AdminCertificateEditPage() {
  return (
    <SchoolShell eyebrow="Certificates" title="Edit Template">
      <CertificateEditPage />
    </SchoolShell>
  );
}
