import { useParams } from "react-router-dom";
import { AdminHomeworkDetailPage } from "@/modules/homework/pages/AdminHomeworkDetailPage";

export function AdminHomeworkDetailPage_Page() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>Invalid homework ID</div>;
  return <AdminHomeworkDetailPage homeworkId={id} />;
}

export default AdminHomeworkDetailPage_Page;
