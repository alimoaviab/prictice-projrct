import { Link } from "react-router-dom";

interface NoAccessProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function NoAccess({
  title = "Access Denied",
  message = "You don't have permission to access this page. Contact your administrator if you believe this is a mistake.",
  backHref = "/admin/dashboard",
  backLabel = "Go to Dashboard",
}: NoAccessProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-gray-400">lock</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
