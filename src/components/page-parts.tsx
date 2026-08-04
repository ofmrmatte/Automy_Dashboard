import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { Card } from "./ui";

export function PageHeader({ title, description, action, eyebrow }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div className="min-w-0">{eyebrow && <div className="mb-1 text-xs font-medium text-primary">{eyebrow}</div>}<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}

export function MetricCard({ label, value, change, icon: Icon, positive = true, helper }: { label: string; value: string; change?: string; icon: LucideIcon; positive?: boolean; helper?: string }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div className="text-sm text-muted-foreground">{label}</div><div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-4" /></div></div><div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-2 flex items-center gap-1.5 text-xs">{change && <span className={positive ? "text-success" : "text-destructive"}>{positive ? <ArrowUpRight className="inline size-3.5" /> : <ArrowDownRight className="inline size-3.5" />}{change}</span>}<span className="text-muted-foreground">{helper}</span></div></Card>;
}

export function TableShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) { return <Card className="overflow-hidden"><div className="overflow-x-auto">{children}</div>{footer}</Card>; }
export const th = "whitespace-nowrap bg-muted/40 px-4 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground";
export const td = "whitespace-nowrap border-t border-border px-4 py-3.5 text-sm";