"use client";

import { useState } from "react";
import { useLeave } from "../hooks/useLeave";
import { LeaveRecordRow } from "../types/leave.types";
import { showToast } from "../../../utils/toast";

export default function LeaveListPage() {
  const { state, addLeave, updateLeave, deleteLeave, approveLeave, rejectLeave } = useLeave();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleEdit = (record: LeaveRecordRow) => {
    // allow editing existing leave requests
    // open a simple prompt flow for quick edits
    const notes = window.prompt("Notes/Reason", record.notes || "")?.trim() || "";
    updateLeave(record._id, { notes });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return;
    await deleteLeave(id);
  };

  const handleApprove = async (id: string) => {
    await approveLeave(id);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    await rejectLeave(id, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  };

  const requesters = [
    { _id: "1", name: "Student 1" },
    { _id: "2", name: "Student 2" },
    { _id: "3", name: "Teacher 1" },
    { _id: "4", name: "Teacher 2" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <div className="text-sm text-gray-500">Showing submitted leave requests. Admins can approve/reject.</div>
      </div>

      {state.status === "loading" && <p>Loading...</p>}
      {state.error && <p className="text-red-600">{state.error}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Requester</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Leave Type</th>
              <th className="px-4 py-3 text-left">Start Date</th>
              <th className="px-4 py-3 text-left">End Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.data?.map((record: LeaveRecordRow) => (
              <tr key={record._id} className="border-t">
                <td className="px-4 py-3">{record.requester_name}</td>
                <td className="px-4 py-3 capitalize">{record.requester_type}</td>
                <td className="px-4 py-3 capitalize">{record.leave_type}</td>
                <td className="px-4 py-3">{record.start_date}</td>
                <td className="px-4 py-3">{record.end_date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${record.status === "approved" ? "bg-green-100 text-green-800" :
                      record.status === "rejected" ? "bg-red-100 text-red-800" :
                        record.status === "cancelled" ? "bg-gray-100 text-gray-800" :
                          "bg-yellow-100 text-yellow-800"
                    }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {record.status === "pending" && (
                    <>
                      <button onClick={() => handleApprove(record._id)} className="text-green-600 hover:underline">
                        Approve
                      </button>
                      <button onClick={() => setRejectingId(record._id)} className="text-red-600 hover:underline">
                        Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => handleEdit(record)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(record._id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Leave Request</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setRejectingId(null)} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button onClick={() => handleReject(rejectingId)} className="px-4 py-2 bg-red-600 text-white rounded">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
