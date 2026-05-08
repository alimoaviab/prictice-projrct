"use client";

import React, { useEffect, useState } from "react";
import { LiveClassCard } from "./LiveClassCard";

interface LiveClassListProps {
  role: "TEACHER" | "STUDENT" | "ADMIN";
}

export const LiveClassList: React.FC<LiveClassListProps> = ({ role }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getTeacherName = (teacher: any) => {
    if (!teacher) return "Teacher";

    const user = teacher.user ?? teacher.user_id ?? null;
    if (user?.profile?.first_name || user?.profile?.last_name) {
      return `${user.profile.first_name || ""} ${user.profile.last_name || ""}`.trim();
    }

    if (teacher.first_name || teacher.last_name) {
      return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();
    }

    return teacher.name || teacher.email || "Teacher";
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/live/classes");
      const json = await res.json();
      if (json.success) {
        setClasses(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch live classes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleJoin = async (id: string, link: string) => {
    if (role === "STUDENT") {
      try {
        await fetch("/api/live/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liveClassId: id, action: "join" })
        });
      } catch (error) {
        console.error("Failed to mark attendance", error);
      }
    }
    window.open(link, "_blank");
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/live/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchClasses(); // Refresh
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading classes...</div>;

  if (classes.length === 0) return (
    <div className="rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
      <p className="font-semibold text-slate-900">No sessions scheduled</p>
      <p className="text-sm text-slate-500 mt-1">Live classes will appear here once scheduled.</p>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {classes.map((cls) => (
        <LiveClassCard
          key={cls._id}
          id={cls._id}
          title={cls.title}
          startTime={cls.startTime}
          endTime={cls.endTime}
          subjectName={cls.subjectId?.name || "Subject"}
          teacherName={getTeacherName(cls.teacherId)}
          status={cls.status}
          meetingLink={cls.meetingLink}
          role={role}
          onJoin={handleJoin}
          onUpdateStatus={handleUpdateStatus}
        />
      ))}
    </div>
  );
};
