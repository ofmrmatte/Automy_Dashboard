import type { ReactNode } from "react";
import { APP_NAME } from "@/shared/constants/app";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="grid min-h-screen lg:grid-cols-[43fr_57fr]">
        <aside
          className="relative hidden min-h-screen overflow-hidden border-r border-border bg-muted/30 lg:grid"
          aria-label={`${APP_NAME} símbolo`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,var(--primary)_0,transparent_32%),radial-gradient(circle_at_76%_70%,var(--accent)_0,transparent_28%)] opacity-[0.08]" />
          <div className="absolute -left-24 top-16 size-96 rounded-full border border-primary/10 blur-[1px]" />
          <div className="absolute bottom-8 left-[-12%] h-48 w-[115%] rotate-6 rounded-[50%] border-t border-accent/20" />
          <div className="absolute bottom-20 left-[-10%] h-48 w-[112%] rotate-3 rounded-[50%] border-t border-primary/10" />
          <div className="absolute right-8 top-[-18%] size-80 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-[-16%] left-10 size-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid min-h-full place-items-center px-12 py-16">
            <img
              src="/automy-symbol.svg"
              alt={APP_NAME}
              className="h-[min(82vh,46rem)] max-h-[82%] w-[min(82%,42rem)] scale-125 object-contain drop-shadow-sm"
            />
          </div>
        </aside>
        <section className="grid min-h-screen content-center px-4 py-8 sm:px-6 md:py-12 lg:px-10">
          <div className="mx-auto w-full max-w-[560px] animate-in fade-in duration-500">
            <div className="mb-8 hidden justify-center md:flex lg:hidden">
              <img src="/automy-symbol.svg" alt={APP_NAME} className="h-24 w-24 object-contain" />
            </div>
            <div className="rounded-card border border-border bg-card/95 p-6 text-card-foreground shadow-card backdrop-blur-sm sm:p-8 lg:p-10">
              <div className="border-b border-border pb-7">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
              </div>
              <div className="pt-7">{children}</div>
            </div>
            <p className="mt-7 text-center text-sm text-muted-foreground">© Automy</p>
          </div>
        </section>
      </section>
    </main>
  );
}
