import { useQuery } from "@tanstack/react-query";
import { Check, Minus } from "lucide-react";
import { permissionsQueryOptions } from "@/features/users/api/user.queries";
import { EmptyState } from "@/shared/components/empty-state";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Loader,
} from "@/shared/components/ui";

export function PermissionsPage() {
  const { data = [], isLoading, error } = useQuery(permissionsQueryOptions());

  if (isLoading) return <Loader />;

  if (error) {
    return <EmptyState title="Não foi possível carregar permissões" description={error.message} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Nenhuma permissão configurada"
        description="A matriz de permissões aparecerá aqui quando existir no banco."
      />
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Permissões</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Matriz atual de RBAC persistida no PostgreSQL da Railway.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {data.map((role) => (
          <Card key={role.role}>
            <CardHeader>
              <CardTitle>{role.roleName}</CardTitle>
              <CardDescription>
                {role.permissions.filter((item) => item.enabled).length} permissões ativas
              </CardDescription>
            </CardHeader>
            <CardBody className="grid gap-2">
              {role.permissions.map((permission) => (
                <div
                  key={permission.key}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-border p-3"
                >
                  <span
                    className="mt-0.5 grid size-5 place-items-center rounded-full bg-muted text-muted-foreground data-[enabled=true]:bg-success/10 data-[enabled=true]:text-success"
                    data-enabled={permission.enabled}
                  >
                    {permission.enabled ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Minus className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{permission.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {permission.description ?? permission.key}
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
