import React from "react";

interface LayoutCardProps {
  children: React.ReactNode;
  isActive?: boolean;
  isEditing?: boolean;
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function LayoutCard({ 
  children, 
  isActive, 
  isEditing, 
  className = "", 
  onClick,
  icon,
  title,
  subtitle,
  badge,
  actions
}: LayoutCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col p-4 rounded-xl border transition-all duration-500 bg-white hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${
        isActive 
          ? "ring-1 ring-blue-600/50 border-blue-100 bg-gradient-to-b from-blue-50/20 to-white shadow-sm" 
          : "border-slate-200/60 shadow-sm"
      } ${isEditing ? "border-blue-400 bg-blue-50/5" : ""} ${className}`}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 ${
              isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-400"
            }`}>
              {icon}
            </div>
          )}
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-none truncate group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-1 transition-opacity">
            {actions}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
