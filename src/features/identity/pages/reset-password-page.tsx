import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/features/identity/components/auth-layout";
import { FormError } from "@/features/identity/components/form-error";
import { useIdentity } from "@/features/identity/context/identity-context";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/identity/validation";
import { toast } from "@/shared/components/toast";
import { Button, Field, Input } from "@/shared/components/ui";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useIdentity();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updatePassword(values.password);
      toast.success("Senha redefinida.");
      navigate({ to: "/" });
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível redefinir a senha.");
    }
  });

  return (
    <AuthLayout
      title="Redefinir senha"
      description="Crie uma nova senha para continuar usando a Automy."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="Nova senha">
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
          <FormError message={form.formState.errors.password?.message} />
        </Field>
        <Field label="Confirmar senha">
          <Input
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          <FormError message={form.formState.errors.confirmPassword?.message} />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
          <KeyRound className="size-4" />
          Salvar nova senha
        </Button>
        <Link to="/login" className="text-center text-sm text-primary">
          Voltar para login
        </Link>
      </form>
    </AuthLayout>
  );
}
