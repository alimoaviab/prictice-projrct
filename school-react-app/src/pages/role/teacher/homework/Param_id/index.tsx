import { useParams } from "react-router-dom";
import { TeacherHomeworkDetailPage } from "@/modules/homework/pages/TeacherHomeworkDetailPage";

export function TeacherHomeworkDetailPage_Page() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>Invalid homework ID</div>;
  return <TeacherHomeworkDetailPage homeworkId={id} />;
}

export default TeacherHomeworkDetailPage_Page;
