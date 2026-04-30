import { serviceRequest } from "../../../services/service-client";
import { SettingsFormInput } from "../types/settings.types";

export function getSettings() {
    return serviceRequest<SettingsFormInput>("/api/settings");
}

export function updateSettings(input: SettingsFormInput) {
    return serviceRequest<SettingsFormInput>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(input)
    });
}
