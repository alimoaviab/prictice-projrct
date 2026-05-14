import { SchoolShell } from "@/layouts/SchoolShell";
import { LiveClassCreatePage } from "@/modules/live-classes/pages/LiveClassCreatePage";

export function AdminLiveClassCreatePage() {
    return (
        <SchoolShell title="Schedule Live Class" eyebrow="Operations Center">
            <LiveClassCreatePage role="ADMIN" />
        </SchoolShell>
    );
}
