import { useState, FormEvent } from "react";
import { TeacherRow, TeacherFormInput } from "../types/teacher.types";

export function TeacherEditSidebar({
    teacher,
    isOpen,
    classOptions,
    subjectOptions,
    onClose,
    onSave,
    isSaving,
}: {
    teacher: TeacherRow | null;
    isOpen: boolean;
    classOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
    onClose: () => void;
    onSave: (
        id: string,
        data: Partial<TeacherFormInput>
    ) => Promise<void>;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<Partial<TeacherFormInput>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!teacher) return null;

    const currentForm = {
        first_name: form.first_name ?? teacher.first_name ?? "",
        last_name: form.last_name ?? teacher.last_name ?? "",
        email: form.email ?? teacher.email ?? "",
        phone: form.phone ?? teacher.phone ?? "",
        qualification: form.qualification ?? teacher.qualification ?? "",
        subjects: form.subjects ?? teacher.subjects ?? [],
        class_ids: form.class_ids ?? teacher.class_ids ?? [],
        password: form.password ?? "",
    };

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!currentForm.first_name.trim())
            newErrors.first_name = "First name is required";
        if (!currentForm.email.trim()) newErrors.email = "Email is required";
        if (!currentForm.phone.trim()) newErrors.phone = "Phone is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate() || !teacher) return;
        await onSave(teacher._id, {
            first_name: currentForm.first_name,
            last_name: currentForm.last_name,
            email: currentForm.email,
            phone: currentForm.phone,
            qualification: currentForm.qualification,
            subjects: currentForm.subjects,
            class_ids: currentForm.class_ids,
            password: currentForm.password || undefined,
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
            <div
                className="fixed inset-0 bg-white/10 backdrop-blur-sm z-40 transition-opacity"
                onClick={handleClose}
            />

            <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-96">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">Edit Teacher</h2>
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Personal Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Qualification
                                </label>
                                <input
                                    type="text"
                                    value={currentForm.qualification}
                                    onChange={(e) =>
                                        setForm({ ...form, qualification: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={currentForm.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={currentForm.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Academic Assignment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subjects
                                </label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {subjectOptions.map((subject) => (
                                        <label
                                            key={subject.id}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={currentForm.subjects.includes(subject.id)}
                                                onChange={(e) => {
                                                    const newSubjects = e.target.checked
                                                        ? [...currentForm.subjects, subject.id]
                                                        : currentForm.subjects.filter(
                                                            (id) => id !== subject.id
                                                        );
                                                    setForm({ ...form, subjects: newSubjects });
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-700">
                                                {subject.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Classes
                                </label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {classOptions.map((cls) => (
                                        <label
                                            key={cls.id}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={currentForm.class_ids.includes(cls.id)}
                                                onChange={(e) => {
                                                    const newClassIds = e.target.checked
                                                        ? [...currentForm.class_ids, cls.id]
                                                        : currentForm.class_ids.filter(
                                                            (id) => id !== cls.id
                                                        );
                                                    setForm({ ...form, class_ids: newClassIds });
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-700">{cls.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 normal-case  mb-4">
                            Security
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password (leave blank to keep current)
                            </label>
                            <input
                                type="password"
                                value={currentForm.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Enter new password if you want to change it"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </form>

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
