import { SchoolShell } from "@/layouts/SchoolShell";
import { TemplateHubPage } from "@/modules/templates/pages/TemplateHubPage";

export function AdminTemplatesPage() {
  return (
    <SchoolShell eyebrow="Operations" title="Template Designer">
      <TemplateHubPage />
    </SchoolShell>
  );
}
export default AdminTemplatesPage;
