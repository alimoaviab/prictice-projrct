"use client";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorFallback({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again or contact support if the problem persists.",
  onRetry,
  fullScreen = false,
}: ErrorFallbackProps) {
  const content = (
    <div className="flex flex-col items-center text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-red-500">error</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Try Again
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      {content}
    </div>
  );
}
