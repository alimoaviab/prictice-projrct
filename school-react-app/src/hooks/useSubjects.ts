import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";
import { useTenantContext } from "./useTenantContext";

const SUBJECTS_QUERY_KEY = ["subjects"] as const;

export function useSubjects(academyYearIdLegacy?: string) {
  const { schoolId, academicYearId: ctxYear } = useTenantContext();
  const academyYearId = academyYearIdLegacy || ctxYear;
  const url = academyYearId
    ? `/api/subjects?academic_year_id=${academyYearId}`
    : "/api/subjects";

  return useQuery({
    queryKey: [...SUBJECTS_QUERY_KEY, schoolId, academyYearId],
    queryFn: async () => {
      const result = await serviceRequest<any[]>(url);
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to fetch subjects");
      return result.data || [];
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!schoolId,
  });
}

export function useSubject(subjectId: string) {
  const { schoolId } = useTenantContext();
  return useQuery({
    queryKey: [...SUBJECTS_QUERY_KEY, schoolId, "detail", subjectId],
    queryFn: async () => {
      const result = await serviceRequest<any>(`/api/subjects/${subjectId}`);
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to fetch subject");
      return result.data;
    },
    enabled: !!subjectId && !!schoolId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await serviceRequest<any>("/api/subjects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to create subject");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SUBJECTS_QUERY_KEY, schoolId] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async ({ subjectId, data }: { subjectId: string; data: any }) => {
      const result = await serviceRequest<any>(`/api/subjects/${subjectId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to update subject");
      return result.data;
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(
        [...SUBJECTS_QUERY_KEY, schoolId, "detail", data?._id],
        data
      );
      queryClient.invalidateQueries({ queryKey: [...SUBJECTS_QUERY_KEY, schoolId] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async (subjectId: string) => {
      const result = await serviceRequest<any>(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to delete subject");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SUBJECTS_QUERY_KEY, schoolId] });
    },
  });
}
