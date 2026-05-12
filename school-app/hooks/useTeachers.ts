'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequest } from '../services/service-client';

const TEACHERS_QUERY_KEY = ['teachers'];

export function useTeachers(academyYearId?: string) {
  const url = academyYearId 
    ? `/api/teachers?academic_year_id=${academyYearId}`
    : '/api/teachers';

  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, academyYearId],
    queryFn: async () => {
      const result = await serviceRequest<any[]>(url);
      if (!result.ok) throw new Error(result.error?.message || 'Failed to fetch teachers');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTeacher(teacherId: string) {
  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, teacherId],
    queryFn: async () => {
      const result = await serviceRequest<any>(`/api/teachers/${teacherId}`);
      if (!result.ok) throw new Error(result.error?.message || 'Failed to fetch teacher');
      return result.data;
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await serviceRequest<any>('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to create teacher');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teacherId, data }: { teacherId: string; data: any }) => {
      const result = await serviceRequest<any>(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to update teacher');
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...TEACHERS_QUERY_KEY, data._id], data);
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherId: string) => {
      const result = await serviceRequest<any>(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to delete teacher');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
}
