import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { ManagedUser } from "@/features/users/types";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/features/users/types";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "@/features/users/validation";
import { Button, Field, Input, Modal, Select } from "@/shared/components/ui";

const roleOptions = Object.entries(USER_ROLE_LABELS);
const statusOptions = Object.entries(USER_STATUS_LABELS);

type UserFormValues = CreateUserFormValues | UpdateUserFormValues;

export function UserFormModal({
  open,
  user,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  user?: ManagedUser | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}) {
  const isEditing = Boolean(user);
  const schema = isEditing ? updateUserSchema : createUserSchema;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: user?.id ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "operator",
      status: user?.status ?? "invited",
    } as UserFormValues,
  });

  useEffect(() => {
    form.reset({
      id: user?.id ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "operator",
      status: user?.status ?? "invited",
    } as UserFormValues);
  }, [form, user, open]);

  async function handleSubmit(values: UserFormValues) {
    await onSubmit(values);
    form.reset();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar usuário" : "Novo usuário"}
      description={
        isEditing
          ? "Gerencie o acesso com dados reais da base Railway."
          : "O usuário receberá um convite para definir a própria senha."
      }
      size="lg"
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <input type="hidden" {...form.register("id" as keyof UserFormValues)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input placeholder="Nome completo" {...form.register("name")} />
            <FormError message={form.formState.errors.name?.message} />
          </Field>
          <Field label="E-mail">
            <Input type="email" placeholder="usuario@empresa.com" {...form.register("email")} />
            <FormError message={form.formState.errors.email?.message} />
          </Field>
          <Field label="Perfil">
            <Select {...form.register("role")}>
              {roleOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.role?.message} />
          </Field>
          {isEditing ? (
            <Field label="Status">
              <Select {...form.register("status")}>
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <FormError message={form.formState.errors.status?.message} />
            </Field>
          ) : (
            <input type="hidden" value="invited" {...form.register("status")} />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="size-4" />
            {isEditing ? "Salvar alterações" : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
