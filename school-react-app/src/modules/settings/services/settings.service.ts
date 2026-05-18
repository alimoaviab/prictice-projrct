import { serviceRequest } from "@/services/service-client";
import { SettingsFormInput } from "../types/settings.types";

export function getSettings() {
    return serviceRequest<SettingsFormInput>("/api/settings");
}

export function updateSettings(input: SettingsFormInput) {
    // Transform flat form fields into nested structure expected by backend
    const payload = {
        profile: {
            schoolName: input.academy_name,
            email: input.academy_email,
            phone: input.academy_phone,
            address: input.academy_address,
            principalName: input.principal_name,
            principalEmail: input.principal_email,
            principalPhone: input.principal_phone,
            establishedYear: input.established_year,
        },
        branding: {
            logoUrl: input.logo_url,
        },
        academic: {
            institutionalLevel: input.institutional_level || "K-12",
        }
    };

    return serviceRequest<SettingsFormInput>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(payload)
    });
}
