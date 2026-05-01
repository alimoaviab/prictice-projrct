import { Card } from "./Card";

type DataStateVariant = "loading" | "empty" | "error" | "success";

export function DataState({
  variant,
  title,
  message
}: {
  variant: DataStateVariant;
  title: string;
  message?: string;
}) {
  const tones = {
    error: "text-error",
    loading: "text-primary",
    empty: "text-gray-400",
    success: "text-success",
  };

  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
      <h3 className={`text-lg font-medium mb-1 ${tones[variant]}`}>{title}</h3>
      {message && <p className="text-sm text-gray-500 max-w-xs">{message}</p>}
    </Card>
  );
}
