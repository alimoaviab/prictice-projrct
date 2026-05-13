const ACADEMIC_YEAR_STORAGE_KEY = "academic_year_id";

function decodeSchoolIdFromToken(): string | undefined {
    if (typeof window === "undefined") return undefined;
    const token = window.localStorage.getItem("token");
    if (!token) return undefined;
    try {
        const part = token.split(".")[1];
        if (!part) return undefined;
        const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        return payload?.school_id;
    } catch {
        return undefined;
    }
}

function scopedKey(schoolId?: string) {
    return schoolId ? `${ACADEMIC_YEAR_STORAGE_KEY}:${schoolId}` : ACADEMIC_YEAR_STORAGE_KEY;
}

export function getSelectedAcademicYearId(): string | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    // Prefer the school-scoped key. Fall back to legacy global key.
    const schoolId = decodeSchoolIdFromToken();
    const scoped = schoolId ? window.localStorage.getItem(scopedKey(schoolId)) : null;
    const legacy = window.localStorage.getItem(ACADEMIC_YEAR_STORAGE_KEY);
    const value = (scoped && scoped.trim()) || (legacy && legacy.trim());
    return value && value.length > 0 ? value : undefined;
}

export function setSelectedAcademicYearId(value: string): void {
    if (typeof window === "undefined") {
        return;
    }

    const schoolId = decodeSchoolIdFromToken();
    if (schoolId) {
        window.localStorage.setItem(scopedKey(schoolId), value);
    }
    // Mirror into legacy key so the API client header still picks it up.
    window.localStorage.setItem(ACADEMIC_YEAR_STORAGE_KEY, value);
}

export function getAcademicYearQuery(): string {
    const academicYearId = getSelectedAcademicYearId();
    if (!academicYearId) {
        return "";
    }

    const search = new URLSearchParams({ academic_year_id: academicYearId });
    return `?${search.toString()}`;
}
