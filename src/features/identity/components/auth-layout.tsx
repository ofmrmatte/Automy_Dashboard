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
    <main className="relative isolate h-screen max-h-screen overflow-hidden bg-background text-foreground">
      <style>{`
        @keyframes automy-symbol-float {
          0%, 100% { transform: translateY(-6px); }
          50% { transform: translateY(8px); }
        }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,var(--primary)_0,transparent_30%),radial-gradient(circle_at_74%_68%,var(--accent)_0,transparent_28%),linear-gradient(135deg,var(--background)_0%,var(--muted)_48%,var(--background)_100%)] opacity-[0.09]" />
        <div className="absolute -left-28 top-16 size-[34rem] rounded-full border border-primary/10 blur-[1px]" />
        <div className="absolute left-[-12%] top-[18%] h-72 w-[64%] -rotate-12 rounded-[50%] border-t border-primary/10" />
        <div className="absolute bottom-[8%] left-[-14%] h-52 w-[74%] rotate-6 rounded-[50%] border-t border-accent/20" />
        <div className="absolute bottom-[16%] left-[-10%] h-48 w-[76%] rotate-3 rounded-[50%] border-t border-primary/10" />
        <div className="absolute right-[-8%] top-[-18%] size-[30rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[18%] size-[34rem] rounded-full bg-accent/10 blur-3xl" />
      </div>
      <section className="relative z-10 grid h-full max-h-screen grid-cols-1 content-center gap-6 px-4 py-4 sm:px-6 md:gap-8 md:py-6 lg:grid-cols-[45fr_55fr] lg:items-center lg:gap-10 lg:px-10 xl:px-14">
        <div
          className="pointer-events-none hidden items-center justify-center md:flex lg:h-full lg:justify-end lg:pr-8 xl:pr-12"
          aria-label={`${APP_NAME} símbolo`}
        >
          <div className="relative grid size-28 place-items-center md:size-32 lg:size-[min(76vh,39rem)] lg:-translate-x-10 xl:-translate-x-16">
            <div className="absolute inset-[8%] rounded-full bg-primary/10 blur-3xl lg:inset-[4%]" />
            <div className="absolute inset-[18%] rounded-full bg-accent/10 blur-2xl lg:inset-[12%]" />
            <img
              src="/automy-symbol.svg"
              alt={APP_NAME}
              className="relative z-10 h-full max-h-full w-full max-w-full object-contain drop-shadow-sm [animation:automy-symbol-float_7s_ease-in-out_infinite]"
            />
          </div>
        </div>
        <section className="grid min-h-0 place-items-center">
          <div className="w-full max-w-[560px] animate-in fade-in duration-500">
            <div className="rounded-card border border-border bg-card/95 p-7 text-card-foreground shadow-card backdrop-blur-md sm:p-8 lg:p-10">
              <div className="border-b border-border pb-7">
                <h1 className="text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.5rem]">
                  {title}
                </h1>
                <p className="mt-3 text-[17px] leading-7 text-muted-foreground">{description}</p>
              </div>
              <div className="pt-7">{children}</div>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">© Automy</p>
          </div>
        </section>
      </section>
    </main>
  );
}
