import { cn } from "@/lib/utils";

interface StatCardProps {
  value: number;
  label: string;
  color: "primary" | "secondary" | "accent";
}

export function StatCard({ value, label, color }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-[hsl(var(--positive))]/10 text-[hsl(var(--positive))]",
    accent: "bg-[hsl(var(--plan))]/10 text-[hsl(var(--plan))]"
  };

  return (
    <div className={cn("rounded-lg p-3 text-center", colorClasses[color])}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}