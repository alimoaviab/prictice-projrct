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

            // Transform nested backend structure to flat form structure
            const data = result.data as any;
            const transformed: SettingsFormInput = {
                academy_name: data.profile?.schoolName || "",
                academy_email: data.profile?.email || "",
                academy_phone: data.profile?.phone || "",
                academy_address: data.profile?.address || "",
                principal_name: data.profile?.principalName || "",
                principal_email: data.profile?.principalEmail || "",
                principal_phone: data.profile?.principalPhone || "",
                established_year: data.profile?.establishedYear || "",
                institutional_level: data.academic?.institutionalLevel || "K-12",
                logo_url: data.branding?.logoUrl || "",
            };

            return transformed;
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
