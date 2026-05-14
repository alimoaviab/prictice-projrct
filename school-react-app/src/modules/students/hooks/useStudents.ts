import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { StudentFormInput, StudentRow, StudentPatchInput } from "../types/student.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/student.service";

export function useStudents(filters?: { class_id?: string }) {
	const { state, run } = useSafeAsync<StudentRow[]>();

	const loadStudents = useCallback(() => {
		return run(async () => {
			const result = await service.listStudents(filters);
			if (!result.success) {
				throw new Error(result.message || "Failed to load students");
			}
			return result.data;
		});
	}, [run, filters]);

	const addStudent = useCallback(
		async (input: StudentFormInput) => {
			const result = await service.createStudent(input);
			if (!result.success) {
				showToast(result.message || "Failed to create student", "error");
				return result;
			}
			showToast("Student created.", "success");
			await loadStudents();
			publish("students");
			return result;
		},
		[loadStudents]
	);

	const updateStudent = useCallback(
		async (id: string, input: Partial<StudentPatchInput> | Partial<StudentFormInput>) => {
			const result = await service.updateStudent(id, input as any);
			if (!result.success) {
				showToast(result.message || "Failed to update student", "error");
				return result;
			}
			showToast("Student updated.", "success");
			await loadStudents();
			publish("students");
			return result;
		},
		[loadStudents]
	);

	const deleteStudent = useCallback(
		async (id: string) => {
			const result = await service.deleteStudent(id);
			if (!result.success) {
				showToast(result.message || "Failed to delete student", "error");
				return result;
			}
			showToast("Student deleted.", "success");
			await loadStudents();
			publish("students");
			return result;
		},
		[loadStudents]
	);

	useEffect(() => {
		void loadStudents().catch(() => {});
		return bindRefresh("students", loadStudents);
	}, [loadStudents]);

	return { state, addStudent, updateStudent, deleteStudent };
}

