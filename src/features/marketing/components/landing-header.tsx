import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

const SECTIONS = [
  { label: "Plataforma", href: "#plataforma" },
  { label: "Módulos", href: "#modulos" },
  { label: "Implantação", href: "#implantacao" },
  { label: "Planos", href: "#planos" },
  { label: "Dúvidas", href: "#faq" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#topo" className="flex items-center gap-2">
          <img src="/automy-symbol.svg" alt="" aria-hidden className="size-8" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Automy</span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-button px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Acessar o ERP
            </Button>
          </Link>
          <a href="#contato">
            <Button size="sm">Falar com especialista</Button>
          </a>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      <div
        className={cn(
          "border-t border-border bg-background px-4 py-4 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setOpen(false)}
              className="rounded-button px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-2">
          <a href="#contato" onClick={() => setOpen(false)}>
            <Button className="w-full">Falar com especialista</Button>
          </a>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full">
              Acessar o ERP
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}