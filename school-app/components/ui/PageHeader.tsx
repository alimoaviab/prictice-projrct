import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow && (
          <span className="mb-0.5 block text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] font-medium leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
