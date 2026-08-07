import type { ContractPaymentMethod, ContractPaymentTerms } from "@/features/contracts/types";
import type { Product, ProductCommercialTerms } from "@/features/products/types";
import { formatCpfCnpj } from "@/shared/utils/document";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";

export type ContractPartyInput = {
  companyName: string;
  document: string;
  signerName: string;
  signerDocument?: string | undefined;
  signerEmail?: string | undefined;
  signerPhone?: string | undefined;
  witnessName?: string | undefined;
  witnessDocument?: string | undefined;
};

export type NegotiatedContractTerms = {
  description?: string | undefined;
  scope?: string | undefined;
  deliverables?: string | undefined;
  includedUsers?: number | undefined;
  additionalUsers?: number | undefined;
  additionalUserAmount?: number | undefined;
  hostedByAutomy?: boolean | undefined;
  customUrlEnabled?: boolean | undefined;
  implementationDays?: number | undefined;
  implementationValue?: number | undefined;
  databaseCost?: number | undefined;
  databaseQuantity?: number | undefined;
  basePriceReference?: number | undefined;
  monthlyValue?: number | undefined;
  discountPercent?: number | undefined;
  paymentMethod?: ContractPaymentMethod | string | undefined;
  installmentsCount?: number | undefined;
  installmentDueDays?: number[] | undefined;
  billingPeriod?: string | undefined;
  loyaltyMonths?: number | undefined;
  currency?: string | undefined;
  startsAt?: string | undefined;
  endsAt?: string | undefined;
  renewalAt?: string | undefined;
};

const LEGACY_TERMS: Required<Omit<ProductCommercialTerms, "source">> = {
  schemaVersion: 1,
  deprecated: true,
  hostedOnAutomyUrl: true,
  customUrl: false,
  userLimit: 5,
  segment: "Automação operacional",
  implementationDays: 30,
  implementationFee: 0,
  paymentMethod: "Boleto",
  installments: 1,
  discountPercent: 0,
  hasMonthlyFee: true,
  monthlyFee: 0,
  hasDatabaseCost: false,
  databaseCost: 0,
  extraUserPrice: 0,
  loyaltyMonths: 12,
  deliverables:
    "Implantação, configuração inicial, treinamento operacional e suporte conforme plano contratado.",
};

function yesNo(value: boolean | undefined) {
  return value ? "Sim" : "Não";
}

function safeDate(value: string | undefined) {
  return value ? formatDate(value) : "A definir";
}

function numberWord(value: number) {
  const words = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis"];
  return words[value] ?? String(value);
}

export function normalizeProductTerms(product?: Product | null): ProductCommercialTerms {
  return {
    ...LEGACY_TERMS,
    ...(product?.commercialTerms ?? {}),
  };
}

export function buildCatalogCommercialTerms(): ProductCommercialTerms {
  return {
    schemaVersion: 2,
    source: "catalog",
    deprecated: true,
  };
}

export function buildProductContractTemplate(product: {
  name: string;
  category: string;
  description?: string;
}) {
  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA - ${product.name.toUpperCase()}

CONTRATADA: AUTOMY, fornecedora de soluções digitais, automações, sistemas e serviços de tecnologia.
CONTRATANTE: pessoa jurídica identificada no quadro de contratação do contrato.

1. OBJETO
1.1. O presente instrumento regula a prestação de serviços relacionados ao sistema ${product.name}, classificado como ${product.category}.
1.2. Escopo base do serviço: ${product.description || "solução tecnológica para gestão, automação e controle operacional."}

2. IMPLANTAÇÃO
2.1. A implantação será conduzida conforme escopo, prazos, acessos e entregáveis definidos no quadro de contratação.
2.2. A CONTRATANTE deverá fornecer informações, acessos e aprovações necessárias para execução dos serviços.

3. LICENÇA, HOSPEDAGEM E USO
3.1. O uso da solução observará os limites, acessos, hospedagem e condições comerciais definidos no quadro de contratação.
3.2. Usuários adicionais, bancos de dados adicionais, customizações, integrações e demandas fora do escopo poderão ser orçados separadamente.

4. MENSALIDADE, COBRANÇA E FIDELIDADE
4.1. Valores, forma de pagamento, periodicidade, descontos, fidelidade e vencimentos serão aqueles congelados no contrato.
4.2. A inadimplência poderá acarretar suspensão de acesso após comunicação prévia, sem prejuízo dos valores vencidos.

5. ENTREGAS
5.1. As entregas contratadas são aquelas descritas no quadro de contratação e no escopo aprovado entre as partes.
5.2. Serviços fora do escopo, integrações não previstas, customizações adicionais ou mudanças solicitadas após aprovação poderão ser orçados separadamente.

6. RESPONSABILIDADES
6.1. A CONTRATADA executará os serviços com zelo técnico, respeitando boas práticas de segurança, disponibilidade razoável e confidencialidade.
6.2. A CONTRATANTE deverá fornecer dados corretos, acessos, aprovações e validar entregas nos prazos combinados.

7. PROTEÇÃO DE DADOS E CONFIDENCIALIDADE
7.1. As partes comprometem-se a observar a legislação brasileira aplicável, incluindo a Lei Geral de Proteção de Dados quando houver tratamento de dados pessoais.
7.2. Informações técnicas, comerciais, credenciais e dados de clientes deverão ser tratados como confidenciais.

8. SUPORTE, SUSPENSÃO E RESCISÃO
8.1. O suporte seguirá as condições comerciais contratadas.
8.2. A rescisão deverá respeitar valores vencidos, serviços já executados e eventual fidelidade contratada.

9. DISPOSIÇÕES GERAIS
9.1. Este modelo é uma minuta operacional e pode exigir adequação jurídica conforme caso concreto, setor, risco, forma de cobrança e legislação aplicável.
9.2. O foro e demais condições específicas poderão ser definidos no quadro final de contratação.`;
}

export function buildPaymentTerms(
  input: Pick<
    NegotiatedContractTerms,
    "installmentDueDays" | "installmentsCount" | "paymentMethod"
  > & {
    firstDueInDays?: number | undefined;
    intervalDays?: number | undefined;
    specificDates?: string[] | undefined;
  },
): ContractPaymentTerms {
  const method = (input.paymentMethod || "Boleto") as ContractPaymentMethod;
  const installments = Math.max(1, Number(input.installmentsCount ?? 1));
  const intervalDays = Math.max(1, Number(input.intervalDays ?? 30));
  const firstDueInDays = Math.max(0, Number(input.firstDueInDays ?? 30));
  const dueDays = input.installmentDueDays?.length
    ? input.installmentDueDays
    : Array.from({ length: installments }, (_, index) => firstDueInDays + index * intervalDays);
  const specificDates = input.specificDates?.filter(Boolean) ?? [];
  const description =
    method === "Boleto parcelado"
      ? `O valor de implantação será pago por boleto bancário, em ${numberWord(installments)} parcelas, com vencimentos em ${dueDays.join(", ")} dias contados da assinatura deste instrumento.`
      : `A forma de pagamento acordada é ${method}.`;

  return {
    method,
    installments,
    firstDueInDays,
    intervalDays,
    dueDays,
    specificDates,
    description,
  };
}

export function stripDuplicatedSignatureSection(contractText: string) {
  return contractText.replace(/\n+\s*ASSINATURAS\s*\n+[\s\S]*?(?=\n*$)/i, "").trim();
}

export function buildContractDraft(
  product: Product,
  party: ContractPartyInput,
  negotiatedTerms: NegotiatedContractTerms = {},
) {
  const legacyTerms = normalizeProductTerms(product);
  const template =
    product.contractTemplate?.trim() ||
    buildProductContractTemplate({
      name: product.name,
      category: product.category,
      ...(product.description ? { description: product.description } : {}),
    });
  const paymentTerms = buildPaymentTerms({
    paymentMethod: negotiatedTerms.paymentMethod,
    installmentsCount: negotiatedTerms.installmentsCount,
    installmentDueDays: negotiatedTerms.installmentDueDays,
  });

  const commercialBlock = `
QUADRO DE CONDIÇÕES NEGOCIADAS
Plano contratado: ${product.name}${negotiatedTerms.description ? ` - ${negotiatedTerms.description}` : ""}.
Escopo contratado: ${negotiatedTerms.scope || product.description || "Conforme proposta aprovada entre as partes."}
Entregáveis: ${negotiatedTerms.deliverables || legacyTerms.deliverables || "Conforme escopo aprovado."}
Preço-base de referência: ${formatCurrency(negotiatedTerms.basePriceReference ?? 0)}.
Mensalidade contratada: ${formatCurrency(negotiatedTerms.monthlyValue ?? 0)}.
Implantação contratada: ${formatCurrency(negotiatedTerms.implementationValue ?? 0)}.
Prazo de implantação: ${negotiatedTerms.implementationDays ?? 0} dias corridos.
Forma de pagamento: ${paymentTerms.description}
Periodicidade: ${negotiatedTerms.billingPeriod || "Mensal"}.
Desconto: ${negotiatedTerms.discountPercent ?? 0}%.
Fidelidade: ${negotiatedTerms.loyaltyMonths ?? 0} meses.
Limite de usuários incluídos: ${negotiatedTerms.includedUsers ?? 1}.
Usuários adicionais: ${negotiatedTerms.additionalUsers ?? 0}, a ${formatCurrency(negotiatedTerms.additionalUserAmount ?? 0)} por usuário.
Hospedagem em URL Automy: ${yesNo(negotiatedTerms.hostedByAutomy)}.
Personalização de URL: ${yesNo(negotiatedTerms.customUrlEnabled)}.
Bancos de dados adicionais: ${negotiatedTerms.databaseQuantity ?? 0}, a ${formatCurrency(negotiatedTerms.databaseCost ?? 0)} por banco.
Início: ${safeDate(negotiatedTerms.startsAt)}.
Vencimento: ${safeDate(negotiatedTerms.endsAt)}.
Renovação: ${safeDate(negotiatedTerms.renewalAt)}.`;

  const hiringBlock = `
QUADRO DE CONTRATAÇÃO
CONTRATANTE: ${party.companyName}
CPF/CNPJ: ${formatCpfCnpj(party.document)}
RESPONSÁVEL PELA ASSINATURA: ${party.signerName}
DOCUMENTO DO RESPONSÁVEL: ${party.signerDocument ? formatCpfCnpj(party.signerDocument) : "Não informado"}
E-MAIL DO RESPONSÁVEL: ${party.signerEmail || "Não informado"}
TELEFONE DO RESPONSÁVEL: ${party.signerPhone || "Não informado"}
SISTEMA CONTRATADO: ${product.name}`;

  return stripDuplicatedSignatureSection(`${template}

${commercialBlock}

${hiringBlock}`);
}
