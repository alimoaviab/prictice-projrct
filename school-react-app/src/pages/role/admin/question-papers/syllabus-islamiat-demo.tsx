import { Navigate } from "react-router-dom";

export function SyllabusIslamiatDemoPage() {
  return <Navigate to="/admin/question-papers/generator?syllabus=ptb&class=ONE&subject=Islamiat" replace />;
}
