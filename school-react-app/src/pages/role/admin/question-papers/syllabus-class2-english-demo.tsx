import { Navigate } from "react-router-dom";

export function SyllabusClass2EnglishDemoPage() {
  return <Navigate to="/admin/question-papers/generator?syllabus=ptb&class=TWO&subject=English" replace />;
}
