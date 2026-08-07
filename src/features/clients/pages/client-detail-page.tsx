import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Download,
  Mail,
  MapPin,
  Phone,
  Globe,
  User,
  Send,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { clientDetailQueryOptions, clientQueryKeys } from "@/features/clients/api/client.queries";
import { clientService } from "@/features/clients/services/client.service";
import type { ClientPortalAccess } from "@/features/clients/types";
import { EmptyState } from "@/shared/components/empty-state";
import { Badge, Button, Card, Loader } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import { toast } from "@/shared/components/toast";

const CLIENT_DETAIL_TABS = [
  "Dados gerais",
  "Contatos",
  "Produtos",
  "Contratos",
  "Financeiro",
  "Acessos ao Portal",
  "Documentos",
  "Histórico",
];

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState("Dados gerais");
  const queryClient = useQueryClient();
  const { data: client, error, isLoading } = useQuery(clientDetailQueryOptions(clientId));
  const portalAccessAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "resend" | "generate" | "disable" }) =>
      clientService.portalAccessAction(id, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      toast.success("Acesso ao Portal atualizado.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o acesso ao Portal.",
      );
    },
  });

  if (isLoading) {
    return (
      <Card>
        <Loader />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState title="Não foi possível carregar o cliente" description={error.message} />
      </Card>
    );
  }

  if (!client) {
    return (
      <Card>
        <EmptyState
          title="Cliente não encontrado"
          action={
            <Link to="/clientes" className="inline-block text-sm text-primary">
              Voltar para clientes
            </Link>
          }
        />
      </Card>
    );
  }

  const details: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Building2, label: "Razão social", value: client.legal },
    { icon: Building2, label: "Segmento", value: client.segment || "Não informado" },
    { icon: MapPin, label: "Localização", value: `${client.city}, ${client.state}` },
    { icon: User, label: "Responsável", value: client.owner || "Não informado" },
    { icon: Building2, label: "Plano contratado", value: client.plan || "Não informado" },
    { icon: Mail, label: "E-mail", value: client.email || "Não informado" },
    { icon: Phone, label: "Telefone", value: client.phone || "Não informado" },
    { icon: Globe, label: "Site", value: client.website || "Não informado" },
  ];

  return (
    <div>
      <Link
        to="/clientes"
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para clientes
      </Link>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
        <div className="grid size-14 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
          {client.initials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <Badge tone={toneForStatus(client.status)}>{client.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.legal} · {client.cnpj}
          </p>
        </div>
      </div>
      <div className="mt-7 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-6">
          {CLIENT_DETAIL_TABS.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? "border-b-2 border-primary pb-3 text-sm font-medium text-foreground"
                  : "pb-3 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {tab === "Dados gerais" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.6fr]">
          <Card className="p-6">
            <h2 className="font-semibold">Informações da empresa</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1 text-sm font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Contato principal</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <User className="size-4 text-muted-foreground" />
                {client.owner || "Não informado"}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                {client.ownerEmail || client.email || "Não informado"}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                {client.ownerPhone || client.phone || "Não informado"}
              </div>
            </div>
          </Card>
        </div>
      ) : tab === "Acessos ao Portal" ? (
        <PortalAccessesPanel
          accesses={client.portalAccesses}
          loading={portalAccessAction.isPending}
          onAction={(id, action) => portalAccessAction.mutate({ id, action })}
        />
      ) : (
        <Card className="mt-6 p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg bg-accent">
              <Download className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">{tab}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhum registro real de {tab.toLowerCase()} foi cadastrado para este cliente.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function statusLabel(value: string | null) {
  if (value === "sent") return "Convite enviado";
  if (value === "activated" || value === "active") return "Ativo";
  if (value === "delivery_failed") return "Falha no envio";
  if (value === "conflict") return "Conflito";
  if (value === "invited") return "Convidado";
  if (value === "inactive" || value === "disabled") return "Inativo";
  return value || "Pendente";
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function PortalAccessesPanel({
  accesses,
  loading,
  onAction,
}: {
  accesses: ClientPortalAccess[];
  loading: boolean;
  onAction: (id: string, action: "resend" | "generate" | "disable") => void;
}) {
  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Acessos ao Portal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Convites e usuários vinculados a este cliente.
          </p>
        </div>
      </div>
      {accesses.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border p-6 text-sm text-muted-foreground">
          Nenhum acesso ao Portal foi provisionado para este cliente.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Nome</th>
                <th className="py-3 pr-4 font-medium">E-mail</th>
                <th className="py-3 pr-4 font-medium">Perfil</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Último acesso</th>
                <th className="py-3 pr-4 font-medium">Ativado em</th>
                <th className="py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accesses.map((access) => (
                <tr key={access.id}>
                  <td className="py-3 pr-4 font-medium">{access.name}</td>
                  <td className="py-3 pr-4">{access.email}</td>
                  <td className="py-3 pr-4">{access.role || "customer_admin"}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={access.status === "active" ? "success" : "warning"}>
                      {statusLabel(access.provisioningStatus ?? access.status)}
                    </Badge>
                    {access.failureReason && (
                      <div className="mt-1 text-xs text-danger">{access.failureReason}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4">{formatDateTime(access.lastLogin)}</td>
                  <td className="py-3 pr-4">{formatDateTime(access.activatedAt)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        loading={loading}
                        onClick={() => onAction(access.id, "resend")}
                      >
                        <Send className="size-4" />
                        Reenviar convite
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        loading={loading}
                        disabled={access.status === "inactive"}
                        onClick={() => onAction(access.id, "disable")}
                      >
                        <ShieldOff className="size-4" />
                        Desativar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
