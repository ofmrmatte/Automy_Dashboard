import { X, Search, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect } from "react";
import { cn } from "../lib/utils";
import type { StatusTone } from "../lib/mock-data";

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "icon" }) {
  return <button className={cn("inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50", variant === "primary" && "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90", variant === "secondary" && "border border-border bg-background text-foreground shadow-xs hover:bg-accent", variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground", variant === "danger" && "bg-destructive text-destructive-foreground", size === "sm" && "h-8 px-3 text-xs", size === "md" && "h-10 px-4 text-sm", size === "icon" && "size-9", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-hidden transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/15", className)} {...props} />;
}

export function SearchInput({ value, onChange, placeholder = "Pesquisar..." }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", tone === "success" && "bg-success/10 text-success", tone === "warning" && "bg-warning/12 text-warning-foreground", tone === "danger" && "bg-destructive/10 text-destructive", tone === "info" && "bg-info/10 text-info", tone === "neutral" && "bg-muted text-muted-foreground")}><span className="size-1.5 rounded-full bg-current" />{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-card", className)}>{children}</div>;
}

export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(); document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-modal"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border p-5"><div className="min-w-0"><h2 className="font-semibold text-foreground">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X className="size-4" /></Button></div><div className="p-5">{children}</div></div></div>;
}

export function Pagination() {
  return <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground"><span>1–5 de 24</span><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Página anterior"><ChevronLeft className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Próxima página"><ChevronRight className="size-4" /></Button></div></div>;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-hidden focus:ring-3 focus:ring-ring/15" {...props}>{children}</select>;
}

export function Loader() { return <div className="grid min-h-48 place-items-center"><LoaderCircle className="size-6 animate-spin text-primary" /><span className="sr-only">Carregando</span></div>; }

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-2 text-sm font-medium text-foreground"><span>{label}</span>{children}</label>; }