import { Navigate } from "react-router-dom";

export function SyllabusClass2MathDemoPage() {
  return <Navigate to="/admin/question-papers/generator?syllabus=ptb&class=TWO&subject=Mathematics" replace />;
}
