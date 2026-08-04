import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/features/identity/components/auth-layout";
import { FormError } from "@/features/identity/components/form-error";
import { useIdentity } from "@/features/identity/context/identity-context";
import { loginSchema, type LoginFormValues } from "@/features/identity/validation";
import { toast } from "@/shared/components/toast";
import { Button, Field, Input } from "@/shared/components/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const { session, signIn } = useIdentity();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (session) {
      navigate({ to: "/" });
    }
  }, [navigate, session]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password);
      toast.success("Sessão iniciada.");
      navigate({ to: "/" });
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível entrar.");
    }
  });

  return (
    <AuthLayout
      title="Entrar na Automy"
      description="Acesse a plataforma com seu e-mail corporativo."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="E-mail">
          <Input type="email" autoComplete="email" {...form.register("email")} />
          <FormError message={form.formState.errors.email?.message} />
        </Field>
        <Field label="Senha">
          <Input type="password" autoComplete="current-password" {...form.register("password")} />
          <FormError message={form.formState.errors.password?.message} />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
          <LogIn className="size-4" />
          Entrar
        </Button>
        <Link to="/recuperar-senha" className="text-center text-sm text-primary">
          Recuperar senha
        </Link>
      </form>
    </AuthLayout>
  );
}
