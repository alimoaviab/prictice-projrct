import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";
import { useTenantContext } from "./useTenantContext";

const STUDENTS_QUERY_KEY = ["students"] as const;

type StudentListOptions = {
  classId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  paginated?: boolean;
};

function buildStudentsUrl(opts: StudentListOptions, academyYearId: string) {
  const params = new URLSearchParams();
  if (opts.classId) params.append("class_id", opts.classId);
  if (academyYearId) params.append("academic_year_id", academyYearId);
  if (opts.status) params.append("status", opts.status);
  if (opts.search) params.append("search", opts.search);
  if (opts.paginated) {
    params.append("page", String(opts.page ?? 1));
    params.append("limit", String(opts.limit ?? 25));
  }
  const qs = params.toString();
  return qs ? `/api/students?${qs}` : "/api/students";
}

export function useStudents(
  classIdOrOptions?: string | StudentListOptions,
  academyYearIdLegacy?: string
) {
  const { schoolId, academicYearId: ctxYear, role } = useTenantContext();

  const opts: StudentListOptions =
    typeof classIdOrOptions === "string" || classIdOrOptions === undefined
      ? { classId: classIdOrOptions as string | undefined }
      : (classIdOrOptions as StudentListOptions);

  const effectiveYear = academyYearIdLegacy || ctxYear;
  const url = buildStudentsUrl(opts, effectiveYear);

  return useQuery({
    queryKey: [
      ...STUDENTS_QUERY_KEY,
      schoolId,
      effectiveYear,
      role,
      opts.classId ?? null,
      opts.status ?? null,
      opts.search ?? null,
      opts.paginated ? `${opts.page ?? 1}:${opts.limit ?? 25}` : "all",
    ],
    queryFn: async () => {
      const result = await serviceRequest<any>(url);
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to fetch students");
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

export function useStudent(studentId: string) {
  const { schoolId, academicYearId } = useTenantContext();
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, schoolId, academicYearId, "detail", studentId],
    queryFn: async () => {
      const result = await serviceRequest<any>(`/api/students/${studentId}`);
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to fetch student");
      return result.data;
    },
    enabled: !!studentId && !!schoolId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await serviceRequest<any>("/api/students", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to create student");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...STUDENTS_QUERY_KEY, schoolId] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const { schoolId, academicYearId } = useTenantContext();

  return useMutation({
    mutationFn: async ({ studentId, data }: { studentId: string; data: any }) => {
      const result = await serviceRequest<any>(`/api/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to update student");
      return result.data;
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(
        [...STUDENTS_QUERY_KEY, schoolId, academicYearId, "detail", data?._id],
        data
      );
      queryClient.invalidateQueries({ queryKey: [...STUDENTS_QUERY_KEY, schoolId] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const { schoolId } = useTenantContext();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const result = await serviceRequest<any>(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (!result.ok)
        throw new Error(result.error?.message || "Failed to delete student");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...STUDENTS_QUERY_KEY, schoolId] });
    },
  });
}
