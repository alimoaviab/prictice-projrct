import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`premium-card p-3 md:p-3.5 ${className}`}
    />
  );
}
