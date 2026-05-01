import { SchoolShell } from "../../../layouts/SchoolShell";
import { HomeworkListPage } from "../../../modules/homework/pages/HomeworkListPage";

export default function AdminHomeworkPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Homework">
            <HomeworkListPage />
        </SchoolShell>
    );
}
