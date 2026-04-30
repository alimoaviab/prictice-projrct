import { PlatformShell } from "../../layouts/PlatformShell";
import { SchoolsPage } from "../../modules/schools/pages/SchoolsPage";

export default function SchoolsRoutePage() {
  return (
    <PlatformShell eyebrow="Tenant Control" title="Manage Schools">
      <SchoolsPage />
    </PlatformShell>
  );
}
