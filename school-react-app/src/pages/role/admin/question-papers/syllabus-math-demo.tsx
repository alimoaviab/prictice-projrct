import { Navigate } from "react-router-dom";

export function SyllabusMathDemoPage() {
  return <Navigate to="/admin/question-papers/generator?syllabus=ptb&class=ONE&subject=Mathematics" replace />;
}
