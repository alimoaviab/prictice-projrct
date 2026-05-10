"use client";

import { useMemo, useState } from "react";

interface TimetableToolbarProps {
  classId: string;
  onClassChange: (id: string) => void;
  classOptions: { id: string; label: string }[];
  onNewEntry: () => void;
  selectedClass?: any;
  conflictsCount: number;
  isCompact: boolean;
  onCompactToggle: () => void;
}

export function TimetableToolbar({ 
  classId, 
  onClassChange, 
  classOptions, 
  onNewEntry, 
  selectedClass,
  conflictsCount,
  isCompact,
  onCompactToggle
}: TimetableToolbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    return classOptions.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classOptions, searchTerm]);

  const activeClass = classOptions.find(opt => opt.id === classId);

  return (
    <div className="flex flex-col gap-4 bg-white/90 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-slate-200/50 shadow-2xl shadow-slate-200/40 sticky top-4 z-50 transition-all duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Brand & Class Selector */}
        <div className="flex items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30">
             <span className="material-symbols-outlined text-[30px]">dashboard_customize</span>
          </div>
          
          <div className="relative group">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 px-1">Academic Workspace</p>
            <div 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-blue-400 hover:bg-white transition-all cursor-pointer min-w-[280px]"
            >
              <span className="material-symbols-outlined text-slate-400">school</span>
              <span className="text-lg font-black text-slate-900 truncate">
                {activeClass ? activeClass.label : "Select Class Section"}
              </span>
              <span className="material-symbols-outlined text-slate-400 ml-auto group-hover:rotate-180 transition-transform duration-300">expand_more</span>
            </div>

            {isSearchOpen && (
              <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search classes..." 
                      className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onClassChange(opt.id);
                          setIsSearchOpen(false);
                          setSearchTerm("");
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${classId === opt.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600'}`}
                      >
                        <span className={`material-symbols-outlined text-lg ${classId === opt.id ? 'text-white' : 'text-slate-400'}`}>class</span>
                        <span className="font-black uppercase tracking-tight text-sm">{opt.label}</span>
                        {classId === opt.id && <span className="material-symbols-outlined ml-auto text-sm">check_circle</span>}
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">search_off</span>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No classes found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Info Badges */}
        <div className="hidden xl:flex items-center gap-4">
           <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                {selectedClass ? `${selectedClass.room_number || 'No Room Assigned'}` : "Unassigned Room"}
              </span>
           </div>
           
           <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-blue-500 text-[18px]">subject</span>
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                {selectedClass?.subjects?.length || 0} Subjects Configured
              </span>
           </div>

           {conflictsCount > 0 && (
             <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-red-50 border border-red-200 shadow-sm animate-bounce">
                <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">
                  {conflictsCount} Schedule Conflicts
                </span>
             </div>
           )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-slate-100 p-1.5 rounded-[1.25rem] border border-slate-200">
              <button 
                onClick={onCompactToggle}
                title={isCompact ? "Show Standard View" : "Show Compact View"}
                className={`p-2 rounded-xl transition-all ${isCompact ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-white'}`}
              >
                <span className="material-symbols-outlined">{isCompact ? 'density_medium' : 'density_small'}</span>
              </button>
              <button title="Print Schedule" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition-all">
                <span className="material-symbols-outlined">print</span>
              </button>
              <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {isMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600">
                              <span className="material-symbols-outlined text-lg">content_copy</span>
                              Duplicate Week
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600">
                              <span className="material-symbols-outlined text-lg">auto_awesome</span>
                              Auto-Generate
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600">
                              <span className="material-symbols-outlined text-lg">file_download</span>
                              Export to Excel
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                              <span className="material-symbols-outlined text-lg">delete_sweep</span>
                              Clear Schedule
                          </button>
                      </div>
                  )}
              </div>
           </div>

           <button
              onClick={onNewEntry}
              className="group flex h-12 items-center gap-3 px-6 bg-blue-600 text-white rounded-[1.25rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95"
           >
              <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">add_circle</span>
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">New Entry</span>
           </button>
        </div>
      </div>
    </div>
  );
}
