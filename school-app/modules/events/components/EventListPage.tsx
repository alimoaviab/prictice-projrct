"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useEvents } from "../hooks/useEvents";
import { EventRecordRow, EventFormInput } from "../types/events.types";
import EventForm from "./EventForm";

export default function EventListPage() {
  const pathname = usePathname();
  const { state, addEvent, updateEvent, deleteEvent } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRecordRow | null>(null);

  const handleSubmit = async (data: EventFormInput) => {
    if (editing) {
      await updateEvent(editing._id, data);
    } else {
      await addEvent(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (record: EventRecordRow) => {
    setEditing(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    await deleteEvent(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Events & Calendar</h1>
        {!pathname.includes("/parent") && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Event
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Edit Event" : "New Event"}
          </h2>
          <EventForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {state.status === "loading" && <p>Loading...</p>}
      {state.error && <p className="text-red-600">{state.error}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Start Date</th>
              <th className="px-4 py-3 text-left">End Date</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Status</th>
              {!pathname.includes("/parent") && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {state.data?.map((record: EventRecordRow) => (
              <tr key={record._id} className="border-t">
                <td className="px-4 py-3">{record.title}</td>
                <td className="px-4 py-3 capitalize">{record.event_type}</td>
                <td className="px-4 py-3">{record.start_date}</td>
                <td className="px-4 py-3">{record.end_date || "-"}</td>
                <td className="px-4 py-3">{record.location || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    record.status === "published" ? "bg-green-100 text-green-800" :
                    record.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {record.status}
                  </span>
                </td>
                {!pathname.includes("/parent") && (
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(record)} className="text-blue-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(record._id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
