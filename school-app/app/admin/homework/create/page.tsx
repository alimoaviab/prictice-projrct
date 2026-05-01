import { SchoolShell } from "../../../../layouts/SchoolShell";
import { HomeworkCreatePage } from "../../../../modules/homework/pages/HomeworkCreatePage";

export default function AdminHomeworkCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Assign Homework">
            <HomeworkCreatePage />
        </SchoolShell>
    );
}
