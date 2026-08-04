import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Download,
  Mail,
  MapPin,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { clientService } from "@/features/clients/services/client.service";
import { Badge, Button, Card } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

const CLIENT_DETAIL_TABS = [
  "Dados gerais",
  "Contatos",
  "Produtos",
  "Contratos",
  "Financeiro",
  "Documentos",
  "Histórico",
];

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState("Dados gerais");
  const client = clientService.getClientByIdSnapshot(clientId);

  if (!client) {
    return (
      <Card className="p-8 text-center">
        <h1 className="font-semibold">Cliente não encontrado</h1>
        <Link to="/clientes" className="mt-3 inline-block text-sm text-primary">
          Voltar para clientes
        </Link>
      </Card>
    );
  }

  const details: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Building2, label: "Razão social", value: client.legal },
    { icon: MapPin, label: "Localização", value: `${client.city}, ${client.state}` },
    { icon: User, label: "Responsável", value: client.owner },
    { icon: Building2, label: "Plano contratado", value: client.plan },
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
                {client.owner}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                contato@{client.id}.com.br
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                (11) 4002-8922
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mt-6 p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg bg-accent">
              <Download className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">{tab}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dados simulados de {tab.toLowerCase()} de {client.name}, organizados para consulta
              operacional.
            </p>
            <Button variant="secondary" className="mt-5">
              Adicionar registro
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
