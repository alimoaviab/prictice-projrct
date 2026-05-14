interface ErrorFallbackProps {
  title?: string;
  message?: string;
  hint?: string;
  onRetry?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  fullScreen?: boolean;
  tone?: "error" | "warning";
}

export function ErrorFallback({
  title = "Something didn't load",
  message = "We couldn't fetch this section. Please retry, or refresh the page if the problem continues.",
  hint,
  onRetry,
  onSecondary,
  secondaryLabel = "Reload page",
  fullScreen = false,
  tone = "error",
}: ErrorFallbackProps) {
  const accent =
    tone === "warning"
      ? { bg: "bg-amber-50", icon: "text-amber-600", iconName: "warning" }
      : { bg: "bg-red-50", icon: "text-red-600", iconName: "error" };

  const handleSecondary = onSecondary
    ? onSecondary
    : () => {
        if (typeof window !== "undefined") window.location.reload();
      };

  const content = (
    <div className="flex flex-col items-center text-center max-w-md mx-auto p-6">
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${accent.bg}`}>
        <span className={`material-symbols-outlined text-3xl ${accent.icon}`}>{accent.iconName}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-2 leading-relaxed">{message}</p>
      {hint && <p className="text-xs text-slate-400 mb-6 leading-relaxed">{hint}</p>}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try again
          </button>
        )}
        <button
          onClick={handleSecondary}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          {secondaryLabel}
        </button>
      </div>
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-[60vh] flex items-center justify-center">{content}</div>;
  }

  return (
    <div className="py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">{content}</div>
  );
}
