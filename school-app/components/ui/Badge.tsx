import { HTMLAttributes } from "react";

type BadgeVariant = "primary" | "secondary" | "success" | "error" | "warning" | "gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "gray", className = "", ...props }: BadgeProps) {
  const variants = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    success: "bg-success/10 text-success border-success/20",
    error: "bg-error/10 text-error border-error/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      {...props}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    />
  );
}
