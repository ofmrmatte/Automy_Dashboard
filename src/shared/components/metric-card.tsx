import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/shared/components/ui";

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  positive = true,
  helper,
}: {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  positive?: boolean;
  helper?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {change && (
          <span className={positive ? "text-success" : "text-destructive"}>
            {positive ? (
              <ArrowUpRight className="inline size-3.5" />
            ) : (
              <ArrowDownRight className="inline size-3.5" />
            )}
            {change}
          </span>
        )}
        <span className="text-muted-foreground">{helper}</span>
      </div>
    </Card>
  );
}
