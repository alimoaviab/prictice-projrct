import { useState, useCallback, useEffect } from "react";
import { SubjectRow, SubjectFormInput } from "../types";
import * as service from "../services/subject.service";

export function useSubjects() {
  const [data, setData] = useState<SubjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await service.listSubjects();
      if (!res.success) throw new Error(res.message || "Failed to fetch subjects");
      setData(res.data || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSubject = async (input: SubjectFormInput) => {
    const res = await service.createSubject(input);
    if (!res.success) throw new Error(res.message || "Failed to create subject");
    await fetchSubjects();
  };

  const updateSubject = async (id: string, input: Partial<SubjectFormInput>) => {
    const res = await service.updateSubject(id, input);
    if (!res.success) throw new Error(res.message || "Failed to update subject");
    await fetchSubjects();
  };

  const deleteSubject = async (id: string) => {
    const res = await service.deleteSubject(id);
    if (!res.success) throw new Error(res.message || "Failed to delete subject");
    await fetchSubjects();
  };

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return {
    data,
    isLoading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    refresh: fetchSubjects,
  };
}
