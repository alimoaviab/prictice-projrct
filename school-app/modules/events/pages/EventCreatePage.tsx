"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "../../../components/ui";
import EventForm from "../components/EventForm";
import { useEvents } from "../hooks/useEvents";
import { EventFormInput } from "../types/events.types";
import { showToast } from "../../../utils/toast";

export function EventCreatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addEvent } = useEvents();

  async function handleCreate(input: EventFormInput) {
    const result = await addEvent(input);
    if (result.ok) {
      showToast("Event created successfully", "success");
      const basePath = pathname.includes("/teacher") ? "/teacher/events" : "/admin/events";
      router.push(basePath);
      router.refresh();
    } else {
      showToast(result.error.message || "Failed to create event", "error");
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={pathname.includes("/teacher") ? "/teacher/events" : "/admin/events"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Events
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add a new event to the school calendar.
          </p>
        </div>

        <EventForm
          onSubmit={handleCreate}
          onCancel={() => router.push(pathname.includes("/teacher") ? "/teacher/events" : "/admin/events")}
        />
      </Card>
    </div>
  );
}
