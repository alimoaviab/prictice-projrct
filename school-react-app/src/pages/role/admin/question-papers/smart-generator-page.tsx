import { SchoolShell } from "@/layouts/SchoolShell";
import { SmartPaperGenerator } from "./smart-generator";

export function SmartPaperGeneratorPage() {
  return (
    <SchoolShell eyebrow="Question Papers" title="Smart Paper Generator">
      <SmartPaperGenerator />
    </SchoolShell>
  );
}
