import { Navigate } from "react-router-dom";

export function SyllabusDemoPage() {
  return <Navigate to="/admin/question-papers/generator?syllabus=ptb&class=ONE&subject=English" replace />;
}
