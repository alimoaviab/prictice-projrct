'use client';

import { useCallback, useEffect } from 'react';
import { useSafeAsync } from './useSafeAsync';
import { serviceRequest } from '../services/service-client';
import type { ClassFormInput, ClassRow } from '../modules/classes/types/class.types';

function buildClassesUrl(academyYearId?: string) {
  return academyYearId ? `/api/classes?academic_year_id=${academyYearId}` : '/api/classes';
}

export function useClasses(academyYearId?: string) {
  const { state, run } = useSafeAsync<ClassRow[]>();

  const refresh = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<ClassRow[]>(buildClassesUrl(academyYearId));
      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to fetch classes');
      }

      return result.data || [];
    });
  }, [academyYearId, run]);

  const addClass = useCallback(async (data: ClassFormInput) => {
    const result = await serviceRequest<ClassRow>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.ok) {
      await refresh();
    }

    return result;
  }, [refresh]);

  const updateClass = useCallback(async (classId: string, data: Partial<ClassFormInput>) => {
    const result = await serviceRequest<ClassRow>(`/api/classes/${classId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (result.ok) {
      await refresh();
    }

    return result;
  }, [refresh]);

  const deleteClass = useCallback(async (classId: string) => {
    const result = await serviceRequest<{ success?: boolean }>(`/api/classes/${classId}`, {
      method: 'DELETE',
    });

    if (result.ok) {
      await refresh();
    }

    return result;
  }, [refresh]);

  useEffect(() => {
    void refresh().catch(() => {
      // Error state is already captured by useSafeAsync.
    });
  }, [refresh]);

  return { state, addClass, updateClass, deleteClass, refresh };
}

export function useClass(classId: string) {
  const { state, run } = useSafeAsync<ClassRow>();

  const refresh = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<ClassRow>(`/api/classes/${classId}`);
      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to fetch class');
      }

      return result.data;
    });
  }, [classId, run]);

  useEffect(() => {
    if (!classId) return;
    void refresh().catch(() => {
      // Error state is already captured by useSafeAsync.
    });
  }, [classId, refresh]);

  return { state, refresh };
}

export function useCreateClass() {
  const { addClass } = useClasses();
  return { mutateAsync: addClass } as const;
}

export function useUpdateClass() {
  const { updateClass } = useClasses();
  return { mutateAsync: updateClass } as const;
}

export function useDeleteClass() {
  const { deleteClass } = useClasses();
  return { mutateAsync: deleteClass } as const;
}
