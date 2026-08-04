import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/features/identity/components/auth-layout";
import { FormError } from "@/features/identity/components/form-error";
import { useIdentity } from "@/features/identity/context/identity-context";
import {
  passwordRecoverySchema,
  type PasswordRecoveryFormValues,
} from "@/features/identity/validation";
import { toast } from "@/shared/components/toast";
import { Button, Field, Input } from "@/shared/components/ui";

export function PasswordRecoveryPage() {
  const { sendPasswordRecovery } = useIdentity();
  const form = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await sendPasswordRecovery(values.email);
      toast.success("Enviamos as instruções para o e-mail informado.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível enviar o e-mail.");
    }
  });

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe seu e-mail para receber o link de redefinição."
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="E-mail">
          <Input type="email" autoComplete="email" {...form.register("email")} />
          <FormError message={form.formState.errors.email?.message} />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
          <Mail className="size-4" />
          Enviar link
        </Button>
        <Link to="/login" className="text-center text-sm text-primary">
          Voltar para login
        </Link>
      </form>
    </AuthLayout>
  );
}
