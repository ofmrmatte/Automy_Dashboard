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

export function formatCurrency(value: number): string {
  return brazilCurrencyFormatter.format(value);
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

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
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
