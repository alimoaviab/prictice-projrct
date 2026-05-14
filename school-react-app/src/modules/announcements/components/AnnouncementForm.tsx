import { FormEvent, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { AnnouncementFormInput, AnnouncementPriority, AnnouncementStatus, AnnouncementTargetType } from "../types/announcement.types";

export function AnnouncementForm({
    onCreate,
    classOptions = []
}: {
    onCreate: (input: AnnouncementFormInput) => Promise<unknown>;
    classOptions?: Array<{ id: string; label: string }>;
}) {
    const [form, setForm] = useState<AnnouncementFormInput>({
        title: "",
        content: "",
        target_type: "all",
        priority: "normal",
        status: "draft"
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = "Title is required";
        if (!form.content.trim()) newErrors.content = "Content is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const result = (await onCreate(form)) as { success?: boolean } | undefined;
            if (result?.success !== false) {
                setForm({
                    title: "",
                    content: "",
                    target_type: "all",
                    priority: "normal",
                    status: "draft"
                });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
                label="Title"
                placeholder="Enter announcement title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                error={errors.title}
                required
            />

            <Input
                label="Content"
                placeholder="Enter announcement content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                error={errors.content}
                required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Target"
                    value={form.target_type}
                    onChange={(e) => setForm({ ...form, target_type: e.target.value as AnnouncementTargetType })}
                    options={[
                        { label: "All", value: "all" },
                        { label: "Classes", value: "classes" },
                        { label: "Teachers", value: "teachers" },
                        { label: "Students", value: "students" }
                    ]}
                />

                <Select
                    label="Priority"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}
                    options={[
                        { label: "Low", value: "low" },
                        { label: "Normal", value: "normal" },
                        { label: "High", value: "high" },
                        { label: "Urgent", value: "urgent" }
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as AnnouncementStatus })}
                    options={[
                        { label: "Draft", value: "draft" },
                        { label: "Published", value: "published" }
                    ]}
                />

                <Input
                    label="Expires On"
                    type="date"
                    value={form.expires_at || ""}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Creating..." : "Create Announcement"}
                </Button>
            </div>
        </form>
    );
}
