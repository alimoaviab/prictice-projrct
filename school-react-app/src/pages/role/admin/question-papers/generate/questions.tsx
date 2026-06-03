import { Navigate, useLocation } from "react-router-dom";

export function QuestionsSelectionPage() {
  const { search } = useLocation();
  return <Navigate to={`/admin/question-papers/generator${search}`} replace />;
}
