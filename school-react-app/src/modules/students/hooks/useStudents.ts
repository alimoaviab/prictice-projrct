import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { showToast } from "@/utils/toast";
import { StudentFormInput, StudentRow, StudentPatchInput } from "../types/student.types";
import { publish, bindRefresh } from "@/services/data-bus";
import * as service from "../services/student.service";

/**
 * useStudents — paginated student list with TanStack Query.
 *
 * Uses the shared `usePaginatedList` hook which provides:
 *   - Automatic pagination (page/per_page query params)
 *   - Debounced search (300ms)
 *   - keepPreviousData (no flash during page change)
 *   - staleTime: 10 minutes (students don't change frequently)
 *   - Automatic academic_year_id scoping from tenant context
 *
 * @param filters - Optional filters (class_id, status)
 */
export function useStudents(filters?: { class_id?: string; status?: string }) {
	const queryClient = useQueryClient();
	const list = usePaginatedList<StudentRow>({
		url: "/api/students",
		resource: "students",
		initialLimit: 25,
		initialFilters: filters,
		staleTime: 10 * 60 * 1000, // 10 minutes — student data is relatively stable
	});

	useEffect(() => {
		return bindRefresh("students", () => {
			void queryClient.invalidateQueries({ queryKey: ["students"] });
			void list.refetch();
		});
	}, [list.refetch, queryClient]);

	const addStudent = useCallback(
		async (input: StudentFormInput) => {
			const result = await service.createStudent(input);
			if (!result.success) {
				showToast(result.message || "Could not create student. Please check the form details and try again.", "error");
				return result;
			}
			showToast("Student created.", "success");
			await queryClient.invalidateQueries({ queryKey: ["students"] });
			list.refetch();
			publish("students");
			return result;
		},
		[list, queryClient]
	);

	const updateStudent = useCallback(
		async (id: string, input: Partial<StudentPatchInput> | Partial<StudentFormInput>) => {
			const result = await service.updateStudent(id, input as any);
			if (!result.success) {
				showToast(result.message || "Could not update student. Please check your changes and try again.", "error");
				return result;
			}
			showToast("Student updated.", "success");
			await queryClient.invalidateQueries({ queryKey: ["students"] });
			list.refetch();
			publish("students");
			return result;
		},
		[list, queryClient]
	);

	const deleteStudent = useCallback(
		async (id: string) => {
			const result = await service.deleteStudent(id);
			if (!result.success) {
				showToast(result.message || "Could not delete student. The student may have linked records.", "error");
				return result;
			}
			showToast("Student deleted.", "success");
			await queryClient.invalidateQueries({ queryKey: ["students"] });
			list.refetch();
			publish("students");
			return result;
		},
		[list, queryClient]
	);

	return {
		// Paginated list state
		students: list.items,
		total: list.total,
		page: list.page,
		perPage: list.limit,
		pages: list.pages,
		isLoading: list.isLoading,
		isFetching: list.isFetching,
		isError: list.isError,
		error: list.error,

		// Pagination controls
		setPage: list.setPage,
		setPerPage: list.setLimit,

		// Search
		search: list.search,
		setSearch: list.setSearch,

		// Filters
		setFilters: list.setFilters,

		// Actions
		addStudent,
		updateStudent,
		deleteStudent,
		refetch: list.refetch,
	};
}
