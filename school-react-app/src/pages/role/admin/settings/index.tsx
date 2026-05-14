import { SchoolShell } from "@/layouts/SchoolShell";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";

export function AdminSettingsPage() {
    return (
        <SchoolShell eyebrow="Configuration" title="School Settings">
            <SettingsPage />
        </SchoolShell>
    );
}
