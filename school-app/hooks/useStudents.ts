'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequest } from '../services/service-client';

const STUDENTS_QUERY_KEY = ['students'];

export function useStudents(classId?: string, academyYearId?: string) {
  let url = '/api/students';
  const params = new URLSearchParams();
  
  if (classId) params.append('class_id', classId);
  if (academyYearId) params.append('academic_year_id', academyYearId);
  
  if (params.toString()) url += `?${params.toString()}`;

  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, classId, academyYearId],
    queryFn: async () => {
      const result = await serviceRequest<any[]>(url);
      if (!result.ok) throw new Error(result.error?.message || 'Failed to fetch students');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, studentId],
    queryFn: async () => {
      const result = await serviceRequest<any>(`/api/students/${studentId}`);
      if (!result.ok) throw new Error(result.error?.message || 'Failed to fetch student');
      return result.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await serviceRequest<any>('/api/students', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to create student');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, data }: { studentId: string; data: any }) => {
      const result = await serviceRequest<any>(`/api/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to update student');
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...STUDENTS_QUERY_KEY, data._id], data);
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const result = await serviceRequest<any>(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to delete student');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
}
