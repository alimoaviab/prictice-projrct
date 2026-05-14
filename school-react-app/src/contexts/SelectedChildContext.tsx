/**
 * Ported 1:1 from old-app/school-app/contexts/SelectedChildContext.tsx.
 *
 * Wraps the parent role layout. Lists linked children, persists the active
 * selection to localStorage, and exposes a `selectChild` mutator. Parent
 * portal pages depend on this exact API surface.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { serviceRequest } from "@/services/service-client";

export interface Child {
  student_id: string;
  student_name: string;
  admission_no: string;
  class_id: string;
  class_name: string;
  class_section: string;
  academic_year: string;
  status: string;
}

interface SelectedChildContextType {
  children: Child[];
  selectedChild: Child | null;
  selectChild: (childId: string) => void;
  loading: boolean;
  error: string | null;
  refreshChildren: () => Promise<void>;
}

const SelectedChildContext = createContext<SelectedChildContextType | undefined>(
  undefined
);

interface ApiChild {
  id: string;
  name: string;
  roll_no: string;
  class_id: string;
  class: string;
  section: string;
  academic_year: string;
  status: string;
}

export function SelectedChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await serviceRequest<{ students: ApiChild[] }>(
        "/api/parent/student-info"
      );

      if (result.ok && result.data?.students) {
        const mappedChildren: Child[] = result.data.students.map((s) => ({
          student_id: s.id,
          student_name: s.name,
          admission_no: s.roll_no,
          class_id: s.class_id,
          class_name: s.class,
          class_section: s.section,
          academic_year: s.academic_year,
          status: s.status,
        }));

        setChildren(mappedChildren);

        if (mappedChildren.length > 0) {
          const savedChildId = localStorage.getItem("selected_child_id");
          const savedChild = savedChildId
            ? mappedChildren.find((c) => c.student_id === savedChildId)
            : null;

          const next = savedChild || mappedChildren[0];
          setSelectedChild(next);
          if (next) {
            localStorage.setItem("selected_child_id", next.student_id);
          }
        }
      } else {
        setError(result.message || "Failed to load children");
      }
    } catch (err) {
      setError("Failed to load children");
      console.error("Error fetching children:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChildren();
  }, [fetchChildren]);

  const selectChild = (childId: string) => {
    const child = children.find((c) => c.student_id === childId);
    if (child) {
      setSelectedChild(child);
      localStorage.setItem("selected_child_id", childId);
    }
  };

  const refreshChildren = async () => {
    await fetchChildren();
  };

  return (
    <SelectedChildContext.Provider
      value={{
        children,
        selectedChild,
        selectChild,
        loading,
        error,
        refreshChildren,
      }}
    >
      {reactChildren}
    </SelectedChildContext.Provider>
  );
}

export function useSelectedChild() {
  const context = useContext(SelectedChildContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedChild must be used within a SelectedChildProvider"
    );
  }
  return context;
}
