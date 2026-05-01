import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`bg-surface border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 ${className}`}
    />
  );
}
