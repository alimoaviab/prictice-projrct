// School app adapter - calls shared services
// In production, these would be actual API calls to /api/academic-years
export async function listAcademicYears() {
    // TODO: Replace with actual API call
    return {
        ok: true,
        data: [
            {
                _id: "1",
                school_id: "school-1",
                year: "2024-2025",
                start_date: "2024-04-01",
                end_date: "2025-03-31",
                is_active: true,
                status: "active"
            },
            {
                _id: "2",
                school_id: "school-1",
                year: "2023-2024",
                start_date: "2023-04-01",
                end_date: "2024-03-31",
                is_active: false,
                status: "completed"
            }
        ]
    };
}

export async function createAcademicYear(input: any) {
    // TODO: Replace with actual API call
    return {
        ok: true,
        data: {
            _id: Date.now().toString(),
            school_id: "school-1",
            ...input,
            status: "draft"
        }
    };
}

export async function updateAcademicYear(id: string, input: any) {
    // TODO: Replace with actual API call
    return {
        ok: true,
        data: {
            _id: id,
            school_id: "school-1",
            ...input
        }
    };
}
