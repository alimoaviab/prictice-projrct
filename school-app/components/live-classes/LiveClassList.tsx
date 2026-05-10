"use client";

import React, { useEffect, useState, useMemo } from "react";
import { LiveClassCard } from "./LiveClassCard";
import { Search, Filter, CalendarX2 } from "lucide-react";

interface LiveClassListProps {
  role: "TEACHER" | "STUDENT" | "ADMIN";
}

export const LiveClassList: React.FC<LiveClassListProps> = ({ role }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Search
      const searchStr = searchQuery.toLowerCase();
      const titleMatch = cls.title?.toLowerCase().includes(searchStr);
      const subjectMatch = cls.subjectId?.name?.toLowerCase().includes(searchStr);
      const teacherMatch = getTeacherName(cls.teacherId).toLowerCase().includes(searchStr);
      const matchesSearch = !searchStr || titleMatch || subjectMatch || teacherMatch;

      // Status
      const matchesStatus = statusFilter === "ALL" || cls.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [classes, searchQuery, statusFilter]);


  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
      <p className="font-medium">Loading session timeline...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search classes, subjects, or teachers..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative sm:w-48 shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="LIVE">Live Now</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* List / Timeline */}
      {filteredClasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
             <CalendarX2 className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 text-base">No sessions found</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {classes.length === 0
              ? "There are no live sessions scheduled in the system yet."
              : "No sessions match your current filter and search criteria."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200 hidden md:block"></div>

          <div className="space-y-4 relative z-10">
            {filteredClasses.map((cls) => (
              <div key={cls._id} className="relative flex items-center md:items-start gap-4 md:gap-6">

                {/* Timeline Dot (Desktop only) */}
                <div className="hidden md:flex mt-6 h-12 w-12 shrink-0 items-center justify-center">
                  <div className={`h-3 w-3 rounded-full border-2 ring-4 ring-white ${
                    cls.status === 'LIVE' ? 'bg-red-500 border-red-500 animate-pulse' :
                    cls.status === 'SCHEDULED' ? 'bg-white border-blue-500' :
                    cls.status === 'COMPLETED' ? 'bg-white border-emerald-500' : 'bg-slate-200 border-slate-300'
                  }`}></div>
                </div>

                <div className="flex-1 w-full">
                  <LiveClassCard
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};