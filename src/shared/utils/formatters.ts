const brazilCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brazilDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const brazilLongDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const brazilDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCurrency(value: number): string {
  return brazilCurrencyFormatter.format(value).replace(/\u00a0/g, " ");
}

export function formatBrazilianCurrencyInput(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
  return brazilCurrencyFormatter.format(Number(value)).replace(/\u00a0/g, " ");
}

export function formatBrazilianCurrencyDraft(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

export function parseBrazilianCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = value.trim();
  if (!normalized) return 0;

  const cleaned = normalized.replace(/[^\d,.-]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const numeric =
    hasComma && hasDot
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? cleaned.replace(",", ".")
        : hasDot
          ? cleaned.replace(/\./g, "")
          : cleaned;
  const parsed = Number(numeric);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "percent",
  }).format((Number.isFinite(value) ? value : 0) / 100);
}

export function formatDate(value: Date | string | number): string {
  return brazilDateFormatter.format(new Date(value));
}

export function formatLongDate(value: Date | string | number): string {
  const formatted = brazilLongDateFormatter.format(new Date(value));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateTime(value: Date | string | number): string {
  return brazilDateTimeFormatter.format(new Date(value));
}

export function formatCpf(value: string): string {
  const valueDigits = digits(value).slice(0, 11);
  return valueDigits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function formatCnpj(value: string): string {
  const valueDigits = digits(value).slice(0, 14);
  return valueDigits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

export function formatCpfCnpj(value: string): string {
  return digits(value).length <= 11 ? formatCpf(value) : formatCnpj(value);
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3").replace(/-$/, "");
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
