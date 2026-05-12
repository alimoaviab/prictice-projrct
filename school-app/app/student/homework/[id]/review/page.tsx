import { StudentHomeworkDetailPage } from "@/modules/homework/pages/StudentHomeworkDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentHomeworkDetailPage homeworkId={id} />;
}
