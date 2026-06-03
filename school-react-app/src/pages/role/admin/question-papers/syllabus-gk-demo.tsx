import { Navigate } from "react-router-dom";

export function SyllabusGKDemoPage() {
  return <Navigate to="/admin/question-papers/generator?syllabus=ptb&class=ONE&subject=General%20Knowledge" replace />;
}
