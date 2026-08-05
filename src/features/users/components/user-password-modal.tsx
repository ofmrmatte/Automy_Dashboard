import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { ManagedUser } from "@/features/users/types";
import {
  updateUserPasswordSchema,
  type UpdateUserPasswordFormValues,
} from "@/features/users/validation";
import { Button, Field, Input, Modal } from "@/shared/components/ui";

export function UserPasswordModal({
  user,
  loading,
  onClose,
  onSubmit,
}: {
  user: ManagedUser | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateUserPasswordFormValues) => Promise<void>;
}) {
  const form = useForm<UpdateUserPasswordFormValues>({
    resolver: zodResolver(updateUserPasswordSchema),
    defaultValues: { id: user?.id ?? "", password: "" },
  });

  useEffect(() => {
    form.reset({ id: user?.id ?? "", password: "" });
  }, [form, user]);

  async function handleSubmit(values: UpdateUserPasswordFormValues) {
    await onSubmit(values);
    form.reset();
  }

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Alterar senha"
      {...(user ? { description: `Defina uma nova senha provisória para ${user.name}.` } : {})}
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <input type="hidden" {...form.register("id")} />
        <Field label="Nova senha">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            {...form.register("password")}
          />
          {form.formState.errors.password?.message && (
            <span className="text-xs font-normal text-destructive">
              {form.formState.errors.password.message}
            </span>
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            <KeyRound className="size-4" />
            Alterar senha
          </Button>
        </div>
      </form>
    </Modal>
  );
}
