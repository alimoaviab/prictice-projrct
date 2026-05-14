import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { BehaviorFormInput, BehaviorRecordRow } from "../types/behavior.types";
import * as service from "../services/behavior.service";

export function useBehavior(filters?: { student_id?: string; teacher_id?: string; status?: string }) {
	const { state, run } = useSafeAsync<BehaviorRecordRow[]>();

	const loadBehavior = useCallback(() => {
		return run(async () => {
			const result = await service.listBehavior(filters);
			if (!result.success) {
				throw new Error(result.message || "Failed to load behavior records");
			}
			return result.data;
		});
	}, [run, filters]);

	const addBehavior = useCallback(
		async (input: BehaviorFormInput) => {
			const result = await service.createBehavior(input);
			if (!result.success) {
				showToast(result.message || "Failed to create behavior record", "error");
				return result;
			}
			showToast("Behavior record created.", "success");
			await loadBehavior();
			return result;
		},
		[loadBehavior]
	);

	const updateBehavior = useCallback(
		async (id: string, input: Partial<BehaviorFormInput>) => {
			const result = await service.updateBehavior(id, input);
			if (!result.success) {
				showToast(result.message || "Failed to update behavior", "error");
				return result;
			}
			showToast("Behavior record updated.", "success");
			await loadBehavior();
			return result;
		},
		[loadBehavior]
	);

	const deleteBehavior = useCallback(
		async (id: string) => {
			const result = await service.deleteBehavior(id);
			if (!result.success) {
				showToast(result.message || "Failed to delete behavior", "error");
				return result;
			}
			showToast("Behavior record deleted.", "success");
			await loadBehavior();
			return result;
		},
		[loadBehavior]
	);

	useEffect(() => {
		void loadBehavior().catch(() => {});
	}, [loadBehavior]);

	return { state, addBehavior, updateBehavior, deleteBehavior };
}
