import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/features/identity/components/auth-layout";
import { FormError } from "@/features/identity/components/form-error";
import { useIdentity } from "@/features/identity/context/identity-context";
import { loginSchema, type LoginFormValues } from "@/features/identity/validation";
import { toast } from "@/shared/components/toast";
import { Button, Checkbox, Field, Input } from "@/shared/components/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const { session, signIn } = useIdentity();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    if (session) {
      navigate({ to: "/" });
    }
  }, [navigate, session]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn(values["email"], values["password"], values["rememberMe"]);
      toast.success("Sessão iniciada.");
      navigate({ to: "/" });
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível entrar.");
    }
  });

  return (
    <AuthLayout title="Entrar na Automy" description="Acesse sua conta para continuar.">
      <form className="grid gap-6 [&>label]:gap-2.5 [&>label]:text-[15px]" onSubmit={onSubmit}>
        <Field label="E-mail">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              autoComplete="email"
              placeholder="seu.email@empresa.com"
              className="h-14 bg-background/80 pl-12 text-base shadow-xs placeholder:text-muted-foreground/70 hover:border-primary/40 hover:bg-background focus:border-primary focus:ring-primary/20"
              {...form.register("email")}
            />
          </div>
          <FormError message={form.formState.errors.email?.message} />
        </Field>
        <Field label="Senha">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              className="h-14 bg-background/80 pl-12 text-base shadow-xs placeholder:text-muted-foreground/70 hover:border-primary/40 hover:bg-background focus:border-primary focus:ring-primary/20"
              {...form.register("password")}
            />
          </div>
          <FormError message={form.formState.errors.password?.message} />
        </Field>
        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox className="size-5" {...form.register("rememberMe")} />
            Lembrar de mim
          </label>
          <Link
            to="/recuperar-senha"
            className="text-sm font-medium text-muted-foreground transition-colors duration-200 ease-[var(--ease-automy)] hover:text-primary"
          >
            Recuperar senha
          </Link>
        </div>
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="h-14 w-full text-base font-semibold shadow-xs hover:-translate-y-px hover:shadow-card active:translate-y-0"
        >
          <LogIn className="size-4" />
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
