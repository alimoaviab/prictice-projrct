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
    <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sticky top-6 z-50 transition-all duration-500 hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Brand & Class Selector */}
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20 shrink-0 relative group">
             <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">calendar_month</span>
             <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600 border-2 border-white animate-pulse" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Timetable</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                <div className="h-1 w-1 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Live Sync</span>
              </div>
            </div>
            
            <div className="relative group mt-1">
              <div 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="flex items-center gap-2.5 px-0 py-0 transition-all cursor-pointer min-w-[200px]"
              >
                <p className="text-[13px] font-black text-slate-400 uppercase tracking-tight group-hover/btn:text-blue-600 transition-colors">
                  {activeClass ? activeClass.label : "All Institutional Classes"}
                </p>
                <span className="material-symbols-outlined text-slate-300 text-base group-hover:text-blue-600 transition-colors">expand_circle_down</span>
              </div>

              {isSearchOpen && (
                <div className="absolute top-full left-0 mt-4 w-[280px] bg-white rounded-3xl border border-slate-200 shadow-[0_30px_100px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-3 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                      <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Search class..." 
                        className="bg-transparent border-none p-0 text-[11px] font-black focus:ring-0 w-full placeholder:text-slate-300"
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
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all mb-1 last:mb-0 ${classId === opt.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="font-black normal-case tracking-tight text-[11px]">{opt.label}</span>
                          {classId === opt.id && <span className="material-symbols-outlined text-sm">check_circle</span>}
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-slate-200 text-3xl mb-2">search_off</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Matches</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
           {conflictsCount > 0 && (
             <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-red-50 border border-red-100 animate-bounce">
                <span className="material-symbols-outlined text-red-500 text-[16px] font-black">warning</span>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">
                  {conflictsCount} Critical Conflicts
                </span>
             </div>
           )}

           <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60">
              <button 
                onClick={onCompactToggle}
                className={`h-9 w-9 flex items-center justify-center rounded-[0.75rem] transition-all ${isCompact ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-blue-600/40 hover:text-blue-600'}`}
                title="Toggle Compact View"
              >
                <span className="material-symbols-outlined text-[20px] font-black">{isCompact ? 'compress' : 'expand'}</span>
              </button>
              <div className="w-px h-5 bg-blue-100 mx-1.5" />
              <button 
                className="h-9 w-9 flex items-center justify-center text-blue-600/40 hover:text-blue-600 transition-all"
                title="Print Timetable"
              >
                <span className="material-symbols-outlined text-[20px] font-black">print</span>
              </button>
           </div>

           <button
              onClick={onNewEntry}
              className="h-12 px-6 bg-blue-600 text-white rounded-[1.25rem] hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] active:scale-95 flex items-center gap-3 group"
           >
              <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <span className="material-symbols-outlined text-[18px] font-black text-white">add</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">Create Record</span>
           </button>
        </div>
      </div>
    </div>
  );
}
