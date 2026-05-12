'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequest } from '../services/service-client';

const SUBJECTS_QUERY_KEY = ['subjects'];

export function useSubjects(academyYearId?: string) {
  const url = academyYearId 
    ? `/api/subjects?academic_year_id=${academyYearId}`
    : '/api/subjects';

  return useQuery({
    queryKey: [...SUBJECTS_QUERY_KEY, academyYearId],
    queryFn: async () => {
      const result = await serviceRequest<any[]>(url);
      if (!result.ok) throw new Error(result.error?.message || 'Failed to fetch subjects');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSubject(subjectId: string) {
  return useQuery({
    queryKey: [...SUBJECTS_QUERY_KEY, subjectId],
    queryFn: async () => {
      const result = await serviceRequest<any>(`/api/subjects/${subjectId}`);
      if (!result.ok) throw new Error(result.error?.message || 'Failed to fetch subject');
      return result.data;
    },
    enabled: !!subjectId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await serviceRequest<any>('/api/subjects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to create subject');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, data }: { subjectId: string; data: any }) => {
      const result = await serviceRequest<any>(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to update subject');
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...SUBJECTS_QUERY_KEY, data._id], data);
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subjectId: string) => {
      const result = await serviceRequest<any>(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
      });
      if (!result.ok) throw new Error(result.error?.message || 'Failed to delete subject');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
}
