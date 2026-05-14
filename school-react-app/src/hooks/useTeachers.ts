import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";
import { useTenantContext } from "./useTenantContext";

const TEACHERS_QUERY_KEY = ["teachers"] as const;

type TeacherListOptions = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  paginated?: boolean;
};

function buildTeachersUrl(opts: TeacherListOptions, academyYearId?: string) {
  const params = new URLSearchParams();
  if (academyYearId) params.append("academic_year_id", academyYearId);
  if (opts.status) params.append("status", opts.status);
  if (opts.search) params.append("search", opts.search);
  if (opts.paginated) {
    params.append("page", String(opts.page ?? 1));
    params.append("limit", String(opts.limit ?? 25));
  }
  const qs = params.toString();
  return qs ? `/api/teachers?${qs}` : "/api/teachers";
}

export function useTeachers(academyYearIdOrOptions?: string | TeacherListOptions) {
  const { schoolId, academicYearId: ctxYear, role } = useTenantContext();

  const opts: TeacherListOptions =
    typeof academyYearIdOrOptions === "string" || academyYearIdOrOptions === undefined
      ? {}
      : (academyYearIdOrOptions as TeacherListOptions);

  const effectiveYear =
    typeof academyYearIdOrOptions === "string" ? academyYearIdOrOptions : ctxYear;
  const url = buildTeachersUrl(opts, effectiveYear);

  return useQuery({
    queryKey: [
      ...TEACHERS_QUERY_KEY,
      schoolId,
      effectiveYear,
      role,
      opts.status ?? null,
      opts.search ?? null,
      opts.paginated ? `${opts.page ?? 1}:${opts.limit ?? 25}` : "all",
    ],
    queryFn: async () => {
      const result = await serviceRequest<any>(url);
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to fetch teachers");
      return (
        result.data ||
        (opts.paginated
          ? { items: [], total: 0, page: 1, limit: 25, pages: 1 }
          : [])
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!schoolId,
  });
}

export function useTeacher(teacherId: string) {
  const { schoolId, academicYearId } = useTenantContext();
  return useQuery({
    queryKey: [
      ...TEACHERS_QUERY_KEY,
      schoolId,
      academicYearId,
      "detail",
      teacherId,
    ],
    queryFn: async () => {
      const result = await serviceRequest<any>(`/api/teachers/${teacherId}`);
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to fetch teacher");
      return result.data;
    },
    enabled: !!teacherId && !!schoolId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await serviceRequest<any>("/api/teachers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to create teacher");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TEACHERS_QUERY_KEY, schoolId] });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { schoolId, academicYearId } = useTenantContext();

  return useMutation({
    mutationFn: async ({ teacherId, data }: { teacherId: string; data: any }) => {
      const result = await serviceRequest<any>(`/api/teachers/${teacherId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to update teacher");
      return result.data;
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(
        [...TEACHERS_QUERY_KEY, schoolId, academicYearId, "detail", data?._id],
        data
      );
      queryClient.invalidateQueries({ queryKey: [...TEACHERS_QUERY_KEY, schoolId] });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async (teacherId: string) => {
      const result = await serviceRequest<any>(`/api/teachers/${teacherId}`, {
        method: "DELETE",
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to delete teacher");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TEACHERS_QUERY_KEY, schoolId] });
    },
  });
}
