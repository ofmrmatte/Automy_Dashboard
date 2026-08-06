import type { AuditableEntity } from "@/shared/types/entity";

export type ClientStatus = "Ativo" | "Implantação" | "Pendente" | "Inativo" | "Bloqueado";

export type Client = AuditableEntity & {
  id: string;
  initials: string;
  name: string;
  legal: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  legalNature: string;
  cnae: string;
  registrationStatus: string;
  openedAt: string;
  segment: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  logoUrl: string;
  owner: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: string;
  status: ClientStatus;
  joined: string;
  address: {
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export type ClientFilter = {
  search: string;
  status: ClientStatus | "Todos";
};
