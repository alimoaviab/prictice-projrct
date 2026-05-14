import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function AdminLiveClassesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/live-class");
  }, [navigate]);


  return null;
}
