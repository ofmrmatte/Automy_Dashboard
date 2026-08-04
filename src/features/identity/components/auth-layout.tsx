import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { APP_DESCRIPTION, APP_NAME } from "@/shared/constants/app";
import { Card } from "@/shared/components/ui";

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
    <main className="grid min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto grid w-full max-w-md content-center">
        <Link to="/" className="mb-8 inline-flex items-center gap-3" aria-label={APP_NAME}>
          <img src="/automy-symbol.svg" alt="" className="size-10 object-contain" />
          <img
            src="/automy-logo-horizontal.svg"
            alt={APP_NAME}
            className="h-10 w-36 object-contain object-left dark:hidden"
          />
          <img
            src="/automy-logo-white.svg"
            alt={APP_NAME}
            className="hidden h-10 w-36 object-contain object-left dark:block"
          />
        </Link>
        <Card className="p-6">
          <div className="border-b border-border pb-5">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="pt-5">{children}</div>
        </Card>
        <p className="mt-5 text-xs text-muted-foreground">{APP_DESCRIPTION}</p>
      </section>
    </main>
  );
}
