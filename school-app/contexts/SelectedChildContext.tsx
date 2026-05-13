"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { serviceRequest } from "../services/service-client";

type Child = {
  link_id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  class_name: string;
  class_section: string;
  grade: string;
  relationship: string;
  is_primary: boolean;
  status: string;
};

type SelectedChildContextType = {
  children: Child[];
  selectedChild: Child | null;
  selectChild: (childId: string) => void;
  loading: boolean;
  error: string | null;
  refreshChildren: () => Promise<void>;
};

const SelectedChildContext = createContext<SelectedChildContextType | undefined>(undefined);

export function SelectedChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await serviceRequest<Child[]>("/api/parent/children");

      if (result.ok && result.data) {
        setChildren(result.data);

        // Auto-select first child or primary child
        if (result.data.length > 0) {
          const primaryChild = result.data.find((c) => c.is_primary) || result.data[0];
          
          // Check if there's a saved selection
          const savedChildId = localStorage.getItem("selected_child_id");
          const savedChild = savedChildId ? result.data.find((c) => c.student_id === savedChildId) : null;
          
          setSelectedChild(savedChild || primaryChild);
          
          if (savedChild || primaryChild) {
            localStorage.setItem("selected_child_id", (savedChild || primaryChild).student_id);
          }
        }
      } else {
        setError(result.error?.message || "Failed to load children");
      }
    } catch (err) {
      setError("Failed to load children");
      console.error("Error fetching children:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

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
        refreshChildren
      }}
    >
      {reactChildren}
    </SelectedChildContext.Provider>
  );
}

export function useSelectedChild() {
  const context = useContext(SelectedChildContext);
  if (context === undefined) {
    throw new Error("useSelectedChild must be used within a SelectedChildProvider");
  }
  return context;
}
