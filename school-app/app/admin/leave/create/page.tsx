import { SchoolShell } from "../../../../layouts/SchoolShell";
import { LeaveCreatePage } from "../../../../modules/leave/pages/LeaveCreatePage";

export default function AdminLeaveCreatePage() {
    return (
        <SchoolShell eyebrow="Operations" title="New Leave Request">
            <LeaveCreatePage />
        </SchoolShell>
    );
}
