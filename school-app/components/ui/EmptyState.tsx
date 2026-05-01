import { ReactNode } from "react";
import Link from "next/link";
import { Card } from "./Card";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  icon?: ReactNode | string;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  const iconContent = typeof icon === "string" ? (
    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
      <span className="material-symbols-outlined text-3xl text-gray-300">{icon}</span>
    </div>
  ) : icon ? (
    <div className="mb-5 text-gray-300">{icon}</div>
  ) : null;

  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2">
      {iconContent}
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {action.label}
            </Link>
          ) : (
            <Button onClick={action.onClick} variant="primary">
              <span className="material-symbols-outlined text-lg mr-1">add</span>
              {action.label}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
