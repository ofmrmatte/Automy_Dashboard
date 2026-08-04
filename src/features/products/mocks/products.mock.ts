import type { Product } from "@/features/products/types";

export const productsMock: Product[] = [
  { name: "Automy Flow", category: "Automação", version: "v4.8.2", clients: 68, status: "Ativo" },
  {
    name: "Automy Desk",
    category: "Atendimento",
    version: "v3.12.0",
    clients: 42,
    status: "Ativo",
  },
  {
    name: "Automy Insights",
    category: "Analytics",
    version: "v2.6.1",
    clients: 31,
    status: "Ativo",
  },
  {
    name: "Automy Connect",
    category: "Integrações",
    version: "v1.9.4",
    clients: 24,
    status: "Beta",
  },
  {
    name: "Automy Legacy",
    category: "Operações",
    version: "v8.1.0",
    clients: 7,
    status: "Descontinuando",
  },
];
