"use client";

import { useEffect, useState } from "react";
import * as subjectService from "@/modules/subjects/services/subject.service";

interface Subject {
    _id: string;
    name: string;
    code: string;
    description?: string;
    status: "active" | "inactive";
}

interface SubjectSelectProps {
    value: string | null;
    onChange: (id: string | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    allowInactive?: boolean;
}

export function SubjectSelect({
    value = null,
    onChange,
    label = "Subject",
    placeholder = "Select a subject...",
    disabled = false,
    required = false,
    allowInactive = false
}: SubjectSelectProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch subjects on mount
    useEffect(() => {
        async function loadSubjects() {
            try {
                setIsLoading(true);
                setError(null);
                const result = await subjectService.listSubjects();

                if (!result.ok) {
                    throw new Error(result.error.message || "Failed to load subjects");
                }

                const data = result.data;

                // Filter by status if needed
                const normalized = data.map((subject) => ({
                    _id: subject._id,
                    name: subject.name,
                    code: subject.code || "",
                    description: subject.description,
                    status: subject.status
                }));
                const filtered = allowInactive ? normalized : normalized.filter(s => s.status === "active");
                setSubjects(filtered);
            } catch (err: any) {
                console.error("[SubjectSelect] Error loading subjects:", err);
                setError(err.message || "Failed to load subjects");
            } finally {
                setIsLoading(false);
            }
        }

        loadSubjects();
    }, [allowInactive]);

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled || isLoading || subjects.length === 0}
                className={`w-full px-4 py-2 rounded-lg border transition-all ${disabled || isLoading
                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    : error || subjects.length === 0
                        ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-900 hover:border-gray-400 cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    }`}
            >
                <option value="">{placeholder}</option>
                {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                    </option>
                ))}
            </select>

            {/* Help Text */}
            {isLoading ? (
                <p className="text-xs text-gray-500">Loading subjects...</p>
            ) : !error && subjects.length === 0 ? (
                <p className="text-xs text-gray-500">No subjects available. Create subjects first.</p>
            ) : null}
        </div>
    );
}
