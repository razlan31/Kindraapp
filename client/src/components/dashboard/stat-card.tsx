import { Card } from "@/components/ui/card";

interface StatCardProps {
  value: number | string;
  label: string;
  color: "primary" | "secondary" | "accent";
}

export function StatCard({ value, label, color }: StatCardProps) {
  const getColorClass = () => {
    switch (color) {
      case "primary":
        return "text-primary";
      case "secondary":
        return "text-secondary";
      case "accent":
        return "text-accent dark:text-accent";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 flex flex-col items-center">
      <span className={`text-2xl font-heading font-semibold ${getColorClass()}`}>
        {value}
      </span>
      <span className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
        {label}
      </span>
    </Card>
  );
}
