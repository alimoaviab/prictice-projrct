import { AppIcon } from "shared/ui/AppIcon";
/**
 * Compact, scalable toolbar for /admin/timetable.
 *
 * Why this rebuild:
 *   The previous toolbar used 28-style rounded-3xl-plus chrome and a
 *   fixed-width brand block, which broke on tablets and grew oversized
 *   when the school had dozens of classes.
 *
 * Design contract — matches the rest of the platform:
 *   - bg-white / border-slate-200 / ring-1 ring-slate-900/5 / rounded-xl
 *   - 9x9 blue-600 icon square
 *   - text-[11px] uppercase eyebrow, text-[13px] page title
 *   - Compact searchable popover for the class selector — supports
 *     hundreds of classes via virtualization-friendly window slicing
 *     (cap 250 visible at a time).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface ClassOption {
  id: string;
  label: string;
  section?: string;
}

interface Props {
  classId: string;
  onClassChange: (id: string) => void;
  classOptions: ClassOption[];
  onNewEntry: () => void;
  conflictsCount: number;
  isCompact: boolean;
  onCompactToggle: () => void;
  canCreate?: boolean;
}

const VISIBLE_CAP = 250;

export function TimetableToolbar({
  classId,
  onClassChange,
  classOptions,
  onNewEntry,
  conflictsCount,
  isCompact,
  onCompactToggle,
  canCreate = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click + ESC
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classOptions.slice(0, VISIBLE_CAP);
    return classOptions
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, VISIBLE_CAP);
  }, [classOptions, search]);

  const active = classOptions.find((o) => o.id === classId);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
      {/* Left — brand + class selector */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-sm shadow-blue-600/15">
          <AppIcon name="Calendar" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 normal-case truncate">
            Schedule · {classOptions.length} {classOptions.length === 1 ? "class" : "classes"}
          </p>
          <div className="relative mt-0.5" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors max-w-full"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <span className="truncate max-w-[220px] md:max-w-[320px]">
                {active ? active.label : "All classes"}
              </span>
              <AppIcon name={open ? "expand_less" : "expand_more"} size={16} className="text-slate-400" />
            </button>

            {open && (
              <div
                className="absolute left-0 mt-2 w-[300px] bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_20px_50px_rgb(0,0,0,0.08)] z-40 overflow-hidden"
                role="listbox"
              >
                <div className="p-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
                    <AppIcon name="Search" size={16} className="text-slate-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search class…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none p-0 text-[12px] font-medium placeholder:text-slate-400"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <AppIcon name="X" size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <ul className="max-h-[300px] overflow-y-auto py-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onClassChange("");
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                        !classId ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-[12px] font-bold">All classes</span>
                      {!classId && (
                        <AppIcon name="Check" size={16} className="text-blue-600" />
                      )}
                    </button>
                  </li>
                  {filtered.length === 0 ? (
                    <li className="px-3 py-6 text-center text-[11px] font-bold text-slate-400 normal-case">
                      No matches
                    </li>
                  ) : (
                    filtered.map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onClassChange(opt.id);
                            setOpen(false);
                            setSearch("");
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                            classId === opt.id
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className="text-[12px] font-bold truncate">{opt.label}</span>
                          {classId === opt.id && (
                            <AppIcon name="Check" size={16} className="text-blue-600" />
                          )}
                        </button>
                      </li>
                    ))
                  )}
                  {classOptions.length > VISIBLE_CAP && search === "" && (
                    <li className="px-3 py-2 text-[10px] font-bold text-slate-400 normal-case border-t border-slate-100">
                      Showing first {VISIBLE_CAP}. Type to search.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {conflictsCount > 0 && (
          <Link
            to={`#conflicts`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-600"
            title="Scheduling conflicts detected"
          >
            <AppIcon name="AlertTriangle" size={16} />
            {conflictsCount} {conflictsCount === 1 ? "conflict" : "conflicts"}
          </Link>
        )}

        <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
          <button
            type="button"
            onClick={onCompactToggle}
            className={`h-8 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
              isCompact
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Toggle compact view"
          >
            <AppIcon name={isCompact ? "expand" : "compress"} size={16} />
            {isCompact ? "Spacious" : "Compact"}
          </button>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
          >
            <AppIcon name="Plus" size={16} />
            New period
          </button>
        )}
      </div>
    </div>
  );
}
