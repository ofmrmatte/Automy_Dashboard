import type { AuditableEntity } from "@/shared/types/entity";

export type ContractStatus =
  "Ativo" | "Implantação" | "Renovação" | "Pendente" | "Suspenso" | "Cancelado" | "Encerrado";

export type Contract = AuditableEntity & {
  id: string;
  clientId: string;
  productId: string;
  client: string;
  product: string;
  plan: string;
  description?: string | null;
  scope?: string | null;
  deliverables?: string | null;
  value: string;
  basePriceReference: number;
  monthlyValue: number;
  implementationValue: number;
  implementationDays: number;
  discountPercent: number;
  paymentMethod: string;
  installmentsCount: number;
  installmentDueDays: number[];
  paymentTerms?: ContractPaymentTerms | null;
  includedUsers: number;
  additionalUsers: number;
  additionalUserAmount: number;
  hostedByAutomy: boolean;
  customUrlEnabled: boolean;
  databaseCost: number;
  databaseQuantity: number;
  loyaltyMonths: number;
  currency: string;
  start: string;
  startsAt: string;
  renewal: string;
  endsAt: string;
  renewalAt: string;
  billingPeriod: string;
  status: ContractStatus;
  signerName?: string | null;
  signerDocument?: string | null;
  signerEmail?: string | null;
  signerPhone?: string | null;
  portalAccessEnabled: boolean;
  portalContactName?: string | null;
  portalContactEmail?: string | null;
  automyRepresentative?: string | null;
  witnessName?: string | null;
  witnessDocument?: string | null;
  contractText?: string | null;
  contractVersion: number;
  contractHash?: string | null;
  signatureStatus: "draft" | "sent" | "signed" | "cancelled";
  signedDocumentPath?: string | null;
  notes?: string | null;
  operationalNotes?: string | null;
  negotiatedTerms?: ContractNegotiatedTerms | null;
  contractSnapshot?: unknown;
};

export type ContractPaymentMethod =
  | "À vista"
  | "Boleto"
  | "Boleto parcelado"
  | "Entrada + parcelamento"
  | "PIX"
  | "Cartão"
  | "Transferência"
  | "Recorrência"
  | "Outro";

export type ContractPaymentTerms = {
  method: ContractPaymentMethod;
  installments: number;
  firstDueInDays: number | null;
  intervalDays: number | null;
  dueDays: number[];
  calculatedDueDays?: number[];
  paymentDueInDays?: number | null;
  downPaymentAmount?: number | null;
  remainingAmount?: number | null;
  installmentAmount?: number | null;
  lastInstallmentAmount?: number | null;
  recurrenceFrequency?: string | null;
  recurrenceDueDay?: number | null;
  recurrenceStartDate?: string | null;
  gateway?: string | null;
  gatewayInstallments?: number | null;
  customDescription?: string | null;
  specificDates: string[];
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractNegotiatedTerms = {
  description?: string | null;
  scope?: string | null;
  deliverables?: string | null;
  includedUsers: number;
  additionalUsers: number;
  additionalUserAmount: number;
  hostedByAutomy: boolean;
  customUrlEnabled: boolean;
  implementationDays: number;
  implementationValue: number;
  databaseCost: number;
  databaseQuantity: number;
  basePriceReference: number;
  monthlyValue: number;
  discountPercent: number;
  paymentMethod: ContractPaymentMethod;
  installmentsCount: number;
  installmentDueDays: number[];
  downPaymentAmount?: number | null;
  paymentDueInDays?: number | null;
  recurrenceDueDay?: number | null;
  recurrenceStartDate?: string | null;
  gatewayInstallments?: number | null;
  customPaymentDescription?: string | null;
  billingPeriod: string;
  loyaltyMonths: number;
  currency: string;
  startsAt: string;
  endsAt: string;
  renewalAt?: string | null;
  operationalNotes?: string | null;
};

export type ContractFilter = {
  search: string;
  status: ContractStatus | "Todos";
};
