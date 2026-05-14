import { useEffect, useState } from "react";
import * as subjectService from "@/modules/subjects/services/subject.service";

interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
}

interface SubjectMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxSubjects?: number;
  allowInactive?: boolean;
}

export function SubjectMultiSelect({
  value = [],
  onChange,
  label = "Subjects",
  placeholder = "Select subjects...",
  disabled = false,
  required = false,
  maxSubjects = 20,
  allowInactive = false,
}: SubjectMultiSelectProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await subjectService.listSubjects();
        if (!result.ok) throw new Error(result.error.message || "Failed to load subjects");
        const data = result.data;
        const normalized = data.map((subject: any) => ({
          _id: subject._id,
          name: subject.name,
          code: subject.code || "",
          description: subject.description,
          status: subject.status,
        }));
        const filtered = allowInactive
          ? normalized
          : normalized.filter((s: Subject) => s.status === "active");
        setSubjects(filtered);
      } catch (err: any) {
        console.error("[SubjectMultiSelect] Error loading subjects:", err);
        setError(err.message || "Failed to load subjects");
      } finally {
        setIsLoading(false);
      }
    }
    loadSubjects();
  }, [allowInactive]);

  const selectedSubjects = subjects.filter((s) => value.includes(s._id));
  const isMaxReached = value.length >= maxSubjects;

  const handleToggle = (subjectId: string) => {
    if (value.includes(subjectId)) {
      onChange(value.filter((id) => id !== subjectId));
    } else if (!isMaxReached) {
      onChange([...value, subjectId]);
    }
  };

  const handleClear = () => onChange([]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

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

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSubjects.map((subject) => (
            <div
              key={subject._id}
              className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
            >
              <span className="text-sm font-medium text-blue-900">{subject.name}</span>
              <button
                type="button"
                onClick={() => handleToggle(subject._id)}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled || isLoading}
        className={`w-full px-2 py-1 rounded-lg border transition-all text-left flex items-center justify-between ${
          disabled || isLoading
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 cursor-pointer"
        } ${isExpanded ? "border-blue-500 ring-1 ring-blue-200" : ""}`}
      >
        <span className="text-sm">
          {value.length === 0 ? placeholder : `${value.length} selected`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {subjects.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No subjects available
              </div>
            ) : (
              subjects.map((subject) => (
                <label
                  key={subject._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(subject._id)}
                    onChange={() => handleToggle(subject._id)}
                    disabled={isMaxReached && !value.includes(subject._id)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                    {subject.code && (
                      <p className="text-xs text-gray-500">{subject.code}</p>
                    )}
                    {subject.description && (
                      <p className="text-xs text-gray-400 truncate">{subject.description}</p>
                    )}
                  </div>
                  {subject.status === "inactive" && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </label>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg">
            <div className="text-xs text-gray-600">
              {value.length} / {maxSubjects} selected
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {isMaxReached && value.length === maxSubjects && (
        <p className="text-xs text-amber-600">Maximum {maxSubjects} subjects reached</p>
      )}

      {!isLoading && !error && subjects.length === 0 && (
        <p className="text-xs text-gray-500">No subjects available. Create subjects first.</p>
      )}
    </div>
  );
}
