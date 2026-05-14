import { useState, FormEvent } from "react";
import { StudentRow, StudentFormInput } from "../types/student.types";

export function StudentEditSidebar({
    student,
    isOpen,
    classOptions,
    subjectOptions = [],
    onClose,
    onSave,
    isSaving,
}: {
    student: StudentRow | null;
    isOpen: boolean;
    classOptions: Array<{ id: string; label: string }>;
    subjectOptions?: Array<{ id: string; label: string }>;
    onClose: () => void;
    onSave: (id: string, data: Partial<StudentFormInput>) => Promise<void>;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<Partial<StudentFormInput>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!student) return null;

    const currentForm = {
        first_name: form.first_name ?? student.first_name ?? "",
        last_name: form.last_name ?? student.last_name ?? "",
        class_id: form.class_id ?? student.class_id ?? "",
        subjects: form.subjects ?? student.subjects ?? [],
        section: form.section ?? student.section ?? "",
        admission_no: form.admission_no ?? student.admission_no ?? "",
        guardian: {
            name: form.guardian?.name ?? student.guardian?.name ?? "",
            phone: form.guardian?.phone ?? student.guardian?.phone ?? "",
            email: form.guardian?.email ?? student.guardian?.email ?? "",
        },
    };

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!currentForm.first_name.trim()) newErrors.first_name = "First name is required";
        if (!currentForm.last_name.trim()) newErrors.last_name = "Last name is required";
        if (!currentForm.class_id.trim()) newErrors.class_id = "Class is required";
        if (!currentForm.section.trim()) newErrors.section = "Section is required";
        if (!currentForm.guardian.name.trim()) newErrors.guardian_name = "Guardian name is required";
        if (!currentForm.guardian.phone.trim()) newErrors.guardian_phone = "Guardian phone is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate() || !student) return;
        await onSave(student._id, {
            first_name: currentForm.first_name,
            last_name: currentForm.last_name,
            class_id: currentForm.class_id,
            subjects: currentForm.subjects,
            section: currentForm.section,
            admission_no: currentForm.admission_no,
            guardian: currentForm.guardian,
        });
        handleClose();
    }

    function handleClose() {
        setForm({});
        setErrors({});
        onClose();
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-white/10 backdrop-blur-sm z-40 transition-opacity"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-96">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Edit Student</h2>
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Name Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Personal Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={currentForm.first_name}
                                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.first_name ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.first_name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={currentForm.last_name}
                                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.last_name ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.last_name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admission Number
                                </label>
                                <input
                                    type="text"
                                    value={currentForm.admission_no}
                                    onChange={(e) => setForm({ ...form, admission_no: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Academic Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Academic Placement
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={currentForm.class_id}
                                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.class_id ? "border-red-500" : "border-gray-300"
                                        }`}
                                >
                                    <option value="">Select class</option>
                                    {classOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.class_id && (
                                    <p className="text-sm text-red-600 mt-1">{errors.class_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Section <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={currentForm.section}
                                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                                    placeholder="e.g., A"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.section ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.section && (
                                    <p className="text-sm text-red-600 mt-1">{errors.section}</p>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Subjects Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Enrolled Subjects
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                            {subjectOptions.map(option => (
                                <label key={option.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.subjects?.includes(option.id) || currentForm.subjects?.includes(option.id)}
                                        onChange={(e) => {
                                            const current = form.subjects ?? currentForm.subjects ?? [];
                                            const newSubjects = e.target.checked
                                                ? [...current, option.id]
                                                : current.filter((id: string) => id !== option.id);
                                            setForm({ ...form, subjects: newSubjects });
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {option.label}
                                </label>
                            ))}
                            {subjectOptions.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No subjects available</p>
                            )}
                        </div>
                    </div>

                    {/* Guardian Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Guardian Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Guardian Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={currentForm.guardian.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            guardian: { ...currentForm.guardian, name: e.target.value },
                                        })
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.guardian_name ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.guardian_name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.guardian_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Guardian Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={currentForm.guardian.phone}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            guardian: { ...currentForm.guardian, phone: e.target.value },
                                        })
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.guardian_phone ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.guardian_phone && (
                                    <p className="text-sm text-red-600 mt-1">{errors.guardian_phone}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Guardian Email
                                </label>
                                <input
                                    type="email"
                                    value={currentForm.guardian.email || ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            guardian: { ...currentForm.guardian, email: e.target.value },
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
}
