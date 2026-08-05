import { Check, ChevronLeft, ChevronRight, LoaderCircle, Search, Upload, X } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useEffect,
} from "react";
import { DEFAULT_PAGINATION_LABEL } from "@/shared/constants/table";
import type { StatusTone } from "@/shared/types/status";
import { cn } from "@/shared/utils/cn";

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-button font-medium transition-all duration-200 ease-[var(--ease-automy)] focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        variant === "secondary" &&
          "border border-border bg-background text-foreground shadow-xs hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground",
        variant === "outline" &&
          "border border-border bg-background text-foreground shadow-xs hover:bg-muted",
        variant === "danger" && "bg-destructive text-destructive-foreground",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "size-9",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-input border border-input bg-background px-3 text-sm outline-hidden transition-shadow duration-200 ease-[var(--ease-automy)] placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/15",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-input border border-input bg-background px-3 py-2 text-sm outline-hidden transition-shadow duration-200 ease-[var(--ease-automy)] placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/15",
        className,
      )}
      {...props}
    />
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export type BadgeVariant =
  | StatusTone
  | "active"
  | "inactive"
  | "pending"
  | "invited"
  | "suspended"
  | "success"
  | "warning"
  | "danger"
  | "info";

export function Badge({
  children,
  tone,
  variant,
}: {
  children: ReactNode;
  tone?: StatusTone;
  variant?: BadgeVariant;
}) {
  const badgeVariant = variant ?? tone ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        (badgeVariant === "success" || badgeVariant === "active") && "bg-success/10 text-success",
        (badgeVariant === "warning" || badgeVariant === "pending" || badgeVariant === "invited") &&
          "bg-warning/12 text-warning-foreground",
        (badgeVariant === "danger" || badgeVariant === "suspended") &&
          "bg-destructive/10 text-destructive",
        badgeVariant === "info" && "bg-info/10 text-info",
        (badgeVariant === "neutral" || badgeVariant === "inactive") &&
          "bg-muted text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-b border-border p-5", className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-border p-5", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-semibold text-foreground", className)}>{children}</h2>;
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "max-h-[92vh] w-full overflow-hidden rounded-modal border border-border bg-background shadow-modal",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-3xl",
          size === "xl" && "max-w-6xl",
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="size-4" />
          </Button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ label = DEFAULT_PAGINATION_LABEL }: { label?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>{label}</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Próxima página">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="h-10 rounded-input border border-input bg-background px-3 text-sm text-foreground outline-hidden transition-shadow duration-200 ease-[var(--ease-automy)] focus:ring-3 focus:ring-ring/15"
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded border-input accent-primary", className)}
      {...props}
    />
  );
}

export function Switch({ checked, className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors has-[:checked]:bg-primary",
        className,
      )}
    >
      <input type="checkbox" checked={checked} className="peer sr-only" {...props} />
      <span className="ml-1 grid size-4 place-items-center rounded-full bg-background text-primary shadow-xs transition-transform peer-checked:translate-x-5">
        <Check className="size-2.5 opacity-0 peer-checked:opacity-100" />
      </span>
    </label>
  );
}

export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="date" {...props} />;
}

export function UploadInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
      <span className="inline-flex h-10 items-center gap-2 rounded-button border border-border bg-background px-4 text-sm font-medium text-foreground shadow-xs hover:bg-muted">
        <Upload className="size-4" />
        Enviar arquivo
      </span>
      <input type="file" className="sr-only" {...props} />
    </label>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("size-6 animate-spin text-primary", className)} />;
}

export function Loader() {
  return (
    <div className="grid min-h-48 place-items-center">
      <Spinner />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Spinner />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-card bg-muted", className)} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
