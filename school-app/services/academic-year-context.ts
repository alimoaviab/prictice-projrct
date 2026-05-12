const ACADEMIC_YEAR_STORAGE_KEY = "academic_year_id";

export function getSelectedAcademicYearId(): string | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const value = window.localStorage.getItem(ACADEMIC_YEAR_STORAGE_KEY);
    return value && value.trim().length > 0 ? value : undefined;
}

export function setSelectedAcademicYearId(value: string): void {
    if (typeof window === "undefined") {
        return;
    }

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
