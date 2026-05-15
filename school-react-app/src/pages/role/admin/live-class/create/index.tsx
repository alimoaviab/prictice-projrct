import { SchoolShell } from "@/layouts/SchoolShell";
import { LiveClassCreatePage } from "@/modules/live-classes/pages/LiveClassCreatePage";

// No giant page title — LiveClassCreatePage owns its header.
export function AdminLiveClassCreatePage() {
    return (
        <SchoolShell>
            <LiveClassCreatePage role="ADMIN" />
        </SchoolShell>
    );
}
