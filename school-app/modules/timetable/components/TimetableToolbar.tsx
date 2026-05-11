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
    <div className="flex flex-col gap-2 bg-white/95 backdrop-blur-3xl p-3 rounded-[2rem] border border-slate-200/60 shadow-2xl shadow-slate-200/30 sticky top-4 z-50 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Brand & Class Selector */}
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 shrink-0">
             <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          </div>
          
          <div className="relative group">
            <div 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-blue-400 hover:bg-white transition-all cursor-pointer min-w-[240px]"
            >
              <span className="material-symbols-outlined text-slate-400 text-lg">school</span>
              <span className="text-sm font-black text-slate-900 truncate">
                {activeClass ? activeClass.label : "Select Class"}
              </span>
              <span className="material-symbols-outlined text-slate-400 text-lg ml-auto group-hover:rotate-180 transition-transform duration-300">expand_more</span>
            </div>

            {isSearchOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
                    <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search..." 
                      className="bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onClassChange(opt.id);
                          setIsSearchOpen(false);
                          setSearchTerm("");
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${classId === opt.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600'}`}
                      >
                        <span className={`material-symbols-outlined text-sm ${classId === opt.id ? 'text-white' : 'text-slate-400'}`}>class</span>
                        <span className="font-black uppercase tracking-tight text-[11px]">{opt.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No results</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Info Chips */}
        <div className="hidden lg:flex items-center gap-2">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`h-1.5 w-1.5 rounded-full ${selectedClass?.room_number ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                {selectedClass?.room_number || 'Room TBA'}
              </span>
           </div>
           
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="material-symbols-outlined text-blue-500 text-[16px]">layers</span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                {selectedClass?.subjects?.length || 0} Subjects
              </span>
           </div>

           {conflictsCount > 0 && (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 animate-pulse">
                <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">
                  {conflictsCount} Conflicts
                </span>
             </div>
           )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60">
              <button 
                onClick={onCompactToggle}
                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${isCompact ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{isCompact ? 'density_medium' : 'density_small'}</span>
              </button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                <span className="material-symbols-outlined text-[18px]">print</span>
              </button>
              <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                  {isMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2">
                          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                              <span className="material-symbols-outlined text-base">content_copy</span>
                              Duplicate
                          </button>
                          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                              <span className="material-symbols-outlined text-base">auto_awesome</span>
                              Auto-Fill
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50">
                              <span className="material-symbols-outlined text-base">delete_sweep</span>
                              Clear
                          </button>
                      </div>
                  )}
              </div>
           </div>

           <button
              onClick={onNewEntry}
              className="h-10 px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 group"
           >
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300">add</span>
              <span className="text-[10px] font-black uppercase tracking-widest">New Entry</span>
           </button>
        </div>
      </div>
    </div>
  );
}
