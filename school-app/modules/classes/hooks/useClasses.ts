"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { ClassFormInput, ClassRow } from "../types/class.types";
import * as service from "../services/class.service";

export function useClasses() {
    const { state, run } = useSafeAsync<ClassRow[]>();

    const loadClasses = useCallback(() => {
        return run(async () => {
            const result = await service.listClasses();
            if (!result.ok) {
                throw new Error(result.error.message);
            }

            return result.data;
        });
    }, [run]);

    const addClass = useCallback(
        async (input: ClassFormInput) => {
            const result = await service.createClass(input);
            if (!result.ok) {
                showToast(result.error.message, "error");
                return result;
            }

            showToast("Class created.", "success");
            await loadClasses();
            return result;
        },
        [loadClasses]
    );

    useEffect(() => {
        void loadClasses();
    }, [loadClasses]);

    return { state, addClass };
}
