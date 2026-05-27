import { AppIcon } from "shared/ui/AppIcon";
import { useState, useMemo } from "react";

/**
 * Chapter Selector Component
 * 
 * Allows teachers to select chapters for:
 * - Paper generation
 * - Syllabus tracking
 * - Progress monitoring
 */

// Generic types that work with both English and General Knowledge syllabi
export interface BaseChapter {
  id: string;
  code: string;
  title: string;
  titleUrdu?: string;
  type: string;
}

export interface BaseUnit {
  id: string;
  title: string;
  titleUrdu?: string;
  type: string;
  chapters: BaseChapter[];
}

interface ChapterSelectorProps {
  units: BaseUnit[];
  selectedChapters: string[];
  onSelectionChange: (chapterIds: string[]) => void;
  title?: string;
  subtitle?: string;
}

export function ChapterSelector({
  units,
  selectedChapters,
  onSelectionChange,
  title = "Select Chapters",
  subtitle = "Choose chapters to include in the paper",
}: ChapterSelectorProps) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(units.map((u) => u.id)));
  const [search, setSearch] = useState("");

  const allChapters = useMemo(() => units.flatMap((u) => u.chapters), [units]);
  const allSelected = selectedChapters.length === allChapters.length;
  const someSelected = selectedChapters.length > 0 && !allSelected;

  const filteredUnits = useMemo(() => {
    if (!search.trim()) return units;
    const q = search.toLowerCase();
    return units
      .map((unit) => ({
        ...unit,
        chapters: unit.chapters.filter(
          (ch) =>
            ch.title.toLowerCase().includes(q) ||
            ch.code.toLowerCase().includes(q) ||
            unit.title.toLowerCase().includes(q)
        ),
      }))
      .filter((unit) => unit.chapters.length > 0);
  }, [units, search]);

  function toggleUnit(unitId: string) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  function toggleChapter(chapterId: string) {
    const next = selectedChapters.includes(chapterId)
      ? selectedChapters.filter((id) => id !== chapterId)
      : [...selectedChapters, chapterId];
    onSelectionChange(next);
  }

  function toggleUnitChapters(unit: BaseUnit) {
    const unitChapterIds = unit.chapters.map((ch) => ch.id);
    const allUnitSelected = unitChapterIds.every((id) => selectedChapters.includes(id));

    if (allUnitSelected) {
      // Deselect all chapters in this unit
      onSelectionChange(selectedChapters.filter((id) => !unitChapterIds.includes(id)));
    } else {
      // Select all chapters in this unit
      const next = [...new Set([...selectedChapters, ...unitChapterIds])];
      onSelectionChange(next);
    }
  }

  function selectAll() {
    onSelectionChange(allChapters.map((ch) => ch.id));
  }

  function clearAll() {
    onSelectionChange([]);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearAll}
            disabled={selectedChapters.length === 0}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={selectAll}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <AppIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chapters..."
          className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400"
        />
      </div>

      {/* Selection Summary */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
        <AppIcon name="CheckCircle2" size={16} className="text-blue-600" />
        <span className="text-[11px] font-bold text-blue-900">
          {selectedChapters.length} of {allChapters.length} chapters selected
        </span>
      </div>

      {/* Units List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
        {filteredUnits.length === 0 ? (
          <div className="text-center py-8 text-[12px] text-slate-400">
            No chapters found matching "{search}"
          </div>
        ) : (
          filteredUnits.map((unit) => {
            const isExpanded = expandedUnits.has(unit.id);
            const unitChapterIds = unit.chapters.map((ch) => ch.id);
            const selectedInUnit = unitChapterIds.filter((id) => selectedChapters.includes(id)).length;
            const allUnitSelected = selectedInUnit === unitChapterIds.length;
            const someUnitSelected = selectedInUnit > 0 && !allUnitSelected;

            return (
              <div key={unit.id} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                {/* Unit Header */}
                <div className="flex items-center gap-3 p-3 border-b border-slate-100">
                  <input
                    type="checkbox"
                    checked={allUnitSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someUnitSelected;
                    }}
                    onChange={() => toggleUnitChapters(unit)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="flex-1 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <AppIcon
                        name={unit.type === "review" ? "RotateCcw" : unit.type === "section" ? "BookText" : "BookOpen"}
                        size={16}
                        className={`${
                          unit.type === "review"
                            ? "text-amber-600"
                            : unit.type === "section"
                            ? "text-violet-600"
                            : "text-blue-600"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900">{unit.title}</span>
                        {(unit as any).titleUrdu && (
                          <span className="text-[11px] text-slate-500 font-normal" dir="rtl">{(unit as any).titleUrdu}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">
                        {selectedInUnit}/{unitChapterIds.length}
                      </span>
                      <AppIcon
                        name="ChevronDown"
                        size={16}
                        className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                </div>

                {/* Chapters */}
                {isExpanded && (
                  <div className="p-2 space-y-1">
                    {unit.chapters.map((chapter) => {
                      const isSelected = selectedChapters.includes(chapter.id);
                      return (
                        <label
                          key={chapter.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleChapter(chapter.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-400">{chapter.code}</span>
                              <span className="text-[12px] font-medium text-slate-700">{chapter.title}</span>
                            </div>
                            {(chapter as any).titleUrdu && (
                              <div className="text-[11px] text-slate-500 mt-0.5" dir="rtl">{(chapter as any).titleUrdu}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
