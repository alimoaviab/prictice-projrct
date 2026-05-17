import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { SettingsFormInput } from "../types/settings.types";
import * as service from "../services/settings.service";

export function useSettings() {
    const { state, run } = useSafeAsync<SettingsFormInput>();

    const loadSettings = useCallback(() => {
        return run(async () => {
            const result = await service.getSettings();
            if (!result.success) {
                throw new Error(result.message || "Failed to load settings");
            }

            return result.data;
        });
    }, [run]);

    const saveSettings = useCallback(
        async (input: SettingsFormInput) => {
            const result = await service.updateSettings(input);
            if (!result.success) {
                showToast(result.message || "Could not save settings. Please check your changes and try again.", "error");
                return result;
            }

            showToast("Settings saved.", "success");
            await loadSettings();
            return result;
        },
        [loadSettings]
    );

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    return { state, saveSettings };
}
