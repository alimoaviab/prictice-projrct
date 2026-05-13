"use client";

import { memo } from "react";

type PaginationProps = {
    page: number;
    pages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    isFetching?: boolean;
    /** Optional list of selectable page sizes */
    pageSizeOptions?: number[];
    /** Hide the limit selector */
    hideLimit?: boolean;
    className?: string;
};

const DEFAULT_SIZES = [10, 25, 50, 100];

function buildPageSequence(current: number, total: number): Array<number | "…"> {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const seq: Array<number | "…"> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) seq.push("…");
    for (let i = start; i <= end; i += 1) seq.push(i);
    if (end < total - 1) seq.push("…");
    seq.push(total);
    return seq;
}

/**
 * Compact, accessible pagination control optimized for the ERP's
 * blue-white theme. Uses memo so re-renders are free as long as inputs
 * don't change (page transitions only trigger on the data parent).
 */
export const Pagination = memo(function Pagination({
    page,
    pages,
    total,
    limit,
    onPageChange,
    onLimitChange,
    isFetching,
    pageSizeOptions = DEFAULT_SIZES,
    hideLimit = false,
    className = ""
}: PaginationProps) {
    if (!total) return null;

    const startRow = Math.min(total, (page - 1) * limit + 1);
    const endRow = Math.min(total, page * limit);
    const sequence = buildPageSequence(page, pages);

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-[11px] ${className}`}>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
                <span>
                    {startRow}-{endRow} of <span className="font-bold text-slate-700">{total}</span>
                </span>
                {isFetching && (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                        <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>
                        updating
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3">
                {!hideLimit && onLimitChange && (
                    <label className="flex items-center gap-1 text-slate-500">
                        Rows
                        <select
                            value={limit}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-400"
                        >
                            {pageSizeOptions.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                    </button>

                    {sequence.map((p, idx) =>
                        p === "…" ? (
                            <span key={`gap-${idx}`} className="px-1 text-slate-400">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`h-7 min-w-[28px] px-1.5 rounded text-[11px] font-bold transition-colors ${
                                    p === page
                                        ? "bg-blue-600 text-white border border-blue-600"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        disabled={page >= pages}
                        onClick={() => onPageChange(Math.min(pages, page + 1))}
                        className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
});
