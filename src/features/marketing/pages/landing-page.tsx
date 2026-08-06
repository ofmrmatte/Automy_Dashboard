import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { LandingHeader } from "../components/landing-header";
import { LeadForm } from "../components/lead-form";
import {
  LANDING_BENEFITS,
  LANDING_FAQ,
  LANDING_METRICS,
  LANDING_MODULES,
  LANDING_PLANS,
  LANDING_STEPS,
} from "../data/landing-content";
import { Badge, Button, Card, CardBody } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

export function LandingPage() {
  return (
    <div id="topo" className="min-h-screen bg-background">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-accent" />
                ERP para logística e transportadoras
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                A operação inteira da sua transportadora em{" "}
                <span className="text-primary">um só sistema</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Clientes, contratos, produtos, financeiro, suporte e relatórios integrados na
                plataforma Automy. Menos planilhas, mais controle e decisões com dados atualizados.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#contato">
                  <Button className="w-full sm:w-auto">
                    Agendar demonstração
                    <ArrowRight className="size-4" />
                  </Button>
                </a>
                <a href="#modulos">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Conhecer os módulos
                  </Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Implantação assistida · Migração da base atual · Sem fidelidade no primeiro ciclo
              </p>
            </div>

            <Card className="shadow-card">
              <CardBody className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Painel Automy</p>
                    <p className="text-xs text-muted-foreground">Visão executiva em tempo real</p>
                  </div>
                  <Badge variant="success">Ao vivo</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {LANDING_METRICS.map((metric) => (
                    <div key={metric.label} className="rounded-card border border-border p-4">
                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {metric.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-card border border-border p-4">
                  <div className="flex items-end gap-2">
                    {[38, 52, 44, 68, 60, 84, 72].map((height, index) => (
                      <div
                        key={index}
                        style={{ height: `${height}px` }}
                        className={cn(
                          "flex-1 rounded-t-md",
                          index % 2 === 0 ? "bg-primary/80" : "bg-accent/70",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Receita recorrente por mês (exemplo ilustrativo)
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Benefícios */}
        <section id="plataforma" className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Feito para quem opera transporte todos os dias
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              A Automy nasceu dentro da rotina de transportadoras. Cada módulo resolve um gargalo
              real de processo, não uma funcionalidade genérica de ERP.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {LANDING_BENEFITS.map((benefit) => (
                <Card key={benefit.title}>
                  <CardBody>
                    <span className="inline-flex size-10 items-center justify-center rounded-button bg-primary/10 text-primary">
                      <benefit.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section id="modulos" className="border-b border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Módulos do ERP Automy
                </h2>
                <p className="mt-4 max-w-2xl text-muted-foreground">
                  Todos integrados na mesma base de dados, com permissões por perfil de usuário.
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline">Ver o sistema por dentro</Button>
              </Link>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {LANDING_MODULES.map((module) => (
                <Card key={module.title} className="transition-shadow hover:shadow-card">
                  <CardBody>
                    <span className="inline-flex size-10 items-center justify-center rounded-button bg-accent/10 text-accent">
                      <module.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{module.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Implantação */}
        <section id="implantacao" className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Da assinatura à operação em poucas semanas
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {LANDING_STEPS.map((step) => (
                <div key={step.step} className="rounded-card border border-border bg-card p-6">
                  <span className="text-sm font-semibold text-primary">{step.step}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="border-b border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Planos que acompanham a sua operação
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Valores de referência. O escopo final é definido após o diagnóstico da operação.
            </p>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {LANDING_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "flex flex-col rounded-card border bg-card p-6",
                    plan.highlighted ? "border-primary shadow-card" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                    {plan.highlighted ? <Badge variant="info">Mais adotado</Badge> : null}
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a href="#contato" className="mt-6">
                    <Button
                      variant={plan.highlighted ? "primary" : "outline"}
                      className="w-full"
                    >
                      Falar com o time
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section id="contato" className="border-b border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Vamos conhecer a sua operação
              </h2>
              <p className="mt-4 text-muted-foreground">
                Em 30 minutos mostramos o ERP funcionando com um cenário parecido com o da sua
                empresa e apontamos o caminho de implantação.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-success" /> Demonstração guiada por especialista
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-success" /> Plano de migração da base atual
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-success" /> Proposta comercial em até 3 dias úteis
                </li>
              </ul>
            </div>
            <Card>
              <CardBody>
                <LeadForm />
              </CardBody>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Perguntas frequentes
            </h2>
            <div className="mt-10 divide-y divide-border rounded-card border border-border bg-card">
              {LANDING_FAQ.map((item) => (
                <details key={item.question} className="group p-6">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/automy-symbol.svg" alt="" aria-hidden className="size-7" />
            <span className="text-sm font-semibold text-foreground">Automy</span>
            <span className="text-xs text-muted-foreground">
              · Software para logística e transportadoras
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Automy</span>
            <Link to="/login" className="font-medium text-foreground hover:text-primary">
              Acessar o ERP
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}