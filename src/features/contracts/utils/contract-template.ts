import type { Product, ProductCommercialTerms } from "@/features/products/types";

export type ContractPartyInput = {
  companyName: string;
  document: string;
  signerName: string;
  witnessName?: string;
};

export type NegotiatedContractTerms = {
  monthlyValue?: number | undefined;
  implementationValue?: number | undefined;
  billingPeriod?: string | undefined;
  startsAt?: string | undefined;
  endsAt?: string | undefined;
  renewalAt?: string | undefined;
};

const DEFAULT_TERMS: ProductCommercialTerms = {
  hostedOnAutomyUrl: true,
  customUrl: false,
  userLimit: 5,
  segment: "Automação operacional",
  implementationDays: 30,
  implementationFee: 0,
  paymentMethod: "Boleto à vista",
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

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function yesNo(value: boolean) {
  return value ? "Sim" : "Não";
}

export function normalizeProductTerms(product?: Product | null): ProductCommercialTerms {
  return {
    ...DEFAULT_TERMS,
    ...(product?.commercialTerms ?? {}),
  };
}

export function buildProductContractTemplate(product: {
  name: string;
  category: string;
  description?: string;
  commercialTerms: ProductCommercialTerms;
}) {
  const terms = product.commercialTerms;

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA - ${product.name.toUpperCase()}

CONTRATADA: AUTOMY, fornecedora de soluções digitais, automações, sistemas e serviços de tecnologia.
CONTRATANTE: pessoa jurídica identificada no quadro de assinatura do contrato.

1. OBJETO
1.1. O presente instrumento regula a prestação de serviços relacionados ao sistema ${product.name}, classificado como ${product.category}.
1.2. Escopo resumido: ${product.description || terms.deliverables}.

2. IMPLANTAÇÃO
2.1. O prazo estimado de implantação é de ${terms.implementationDays} dias corridos, contado a partir da confirmação das informações, acessos e materiais necessários.
2.2. O valor de implantação é de ${money(terms.implementationFee)}, com pagamento por ${terms.paymentMethod}${terms.installments > 1 ? ` em ${terms.installments} parcelas` : ""}.
2.3. Desconto comercial aplicado: ${terms.discountPercent}%.

3. LICENÇA, HOSPEDAGEM E USO
3.1. Hospedagem em URL da Automy: ${yesNo(terms.hostedOnAutomyUrl)}.
3.2. Personalização de URL: ${yesNo(terms.customUrl)}.
3.3. Limite de usuários incluídos: ${terms.userLimit}. Usuários adicionais poderão ser cobrados a ${money(terms.extraUserPrice)} por usuário, quando aplicável.
3.4. Custo adicional por banco de dados: ${terms.hasDatabaseCost ? money(terms.databaseCost) : "Não aplicável"}.

4. MENSALIDADE E FIDELIDADE
4.1. Mensalidade: ${terms.hasMonthlyFee ? money(terms.monthlyFee) : "Não aplicável"}.
4.2. Fidelidade mínima: ${terms.loyaltyMonths} meses, salvo negociação expressa em proposta comercial.

5. ENTREGAS
5.1. A solução entrega: ${terms.deliverables}.
5.2. Serviços fora do escopo, integrações não previstas, customizações adicionais ou mudanças solicitadas após aprovação poderão ser orçados separadamente.

6. RESPONSABILIDADES
6.1. A CONTRATADA executará os serviços com zelo técnico, respeitando boas práticas de segurança, disponibilidade razoável e confidencialidade.
6.2. A CONTRATANTE deverá fornecer dados corretos, acessos, aprovações e validar entregas nos prazos combinados.

7. PROTEÇÃO DE DADOS E CONFIDENCIALIDADE
7.1. As partes comprometem-se a observar a legislação brasileira aplicável, incluindo a Lei Geral de Proteção de Dados quando houver tratamento de dados pessoais.
7.2. Informações técnicas, comerciais, credenciais e dados de clientes deverão ser tratados como confidenciais.

8. SUPORTE, SUSPENSÃO E RESCISÃO
8.1. O suporte seguirá as condições comerciais contratadas.
8.2. Inadimplência poderá acarretar suspensão de acesso após notificação.
8.3. A rescisão deverá respeitar valores vencidos, serviços já executados e eventual fidelidade contratada.

9. DISPOSIÇÕES GERAIS
9.1. Este modelo é uma minuta operacional e pode exigir adequação jurídica conforme caso concreto, setor, risco, forma de cobrança e legislação aplicável.
9.2. O foro e demais condições específicas poderão ser definidos no quadro final de contratação.`;
}

export function buildContractDraft(
  product: Product,
  party: ContractPartyInput,
  negotiatedTerms: NegotiatedContractTerms = {},
) {
  const terms = normalizeProductTerms(product);
  const template =
    product.contractTemplate ??
    buildProductContractTemplate({
      name: product.name,
      category: product.category,
      ...(product.description ? { description: product.description } : {}),
      commercialTerms: terms,
    });

  const witnessBlock = party.witnessName
    ? `\nTESTEMUNHA: ${party.witnessName}\nAssinatura: _______________________________`
    : "\nSem testemunha informada neste cadastro.";

  const commercialBlock = `
CONDIÇÕES NEGOCIADAS DO CONTRATO
Mensalidade negociada: ${money(negotiatedTerms.monthlyValue ?? terms.monthlyFee)}.
Implantação negociada: ${money(negotiatedTerms.implementationValue ?? terms.implementationFee)}.
Periodicidade: ${negotiatedTerms.billingPeriod || "Mensal"}.
Início: ${negotiatedTerms.startsAt || "A definir"}.
Vencimento: ${negotiatedTerms.endsAt || "A definir"}.
Renovação: ${negotiatedTerms.renewalAt || "A definir"}.
Fidelidade original do produto: ${terms.loyaltyMonths} meses.
Forma de pagamento original: ${terms.paymentMethod}.
Entregáveis originais: ${terms.deliverables}.`;

  return `${template}

${commercialBlock}

QUADRO DE CONTRATAÇÃO
CONTRATANTE: ${party.companyName}
CNPJ: ${party.document}
RESPONSÁVEL PELA ASSINATURA: ${party.signerName}
SISTEMA CONTRATADO: ${product.name}

ASSINATURAS
CONTRATANTE: ${party.companyName}
Responsável: ${party.signerName}
Assinatura: _______________________________

CONTRATADA: AUTOMY
Assinatura: _______________________________
${witnessBlock}`;
}
