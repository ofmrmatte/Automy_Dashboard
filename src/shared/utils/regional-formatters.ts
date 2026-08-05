export type RegionalFormatPreferences = {
  locale?: string | null | undefined;
  timeZone?: string | null | undefined;
  currency?: string | null | undefined;
  dateFormat?: string | null | undefined;
  timeFormat?: "24h" | "12h" | null | undefined;
};

export const FALLBACK_LOCALE = "pt-BR";
export const FALLBACK_TIME_ZONE = "America/Sao_Paulo";
export const FALLBACK_CURRENCY = "BRL";

export function detectBrowserLocale() {
  if (typeof navigator === "undefined") return FALLBACK_LOCALE;
  return navigator.language || FALLBACK_LOCALE;
}

export function detectBrowserTimeZone() {
  if (typeof Intl === "undefined") return FALLBACK_TIME_ZONE;
  return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE;
}

export function resolveLocale(preferences?: RegionalFormatPreferences | null) {
  return preferences?.locale || detectBrowserLocale() || FALLBACK_LOCALE;
}

export function resolveTimeZone(
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
) {
  return preferences?.timeZone || detectBrowserTimeZone() || companyTimeZone || FALLBACK_TIME_ZONE;
}

function formatterOptions(
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
) {
  return {
    locale: resolveLocale(preferences),
    timeZone: resolveTimeZone(preferences, companyTimeZone),
    hour12: preferences?.timeFormat === "12h",
  };
}

export function formatShortDate(
  value: Date | string | number,
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
) {
  const options = formatterOptions(preferences, companyTimeZone);
  return new Intl.DateTimeFormat(options.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: options.timeZone,
  }).format(new Date(value));
}

export function formatLongDate(
  value: Date | string | number,
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
) {
  const options = formatterOptions(preferences, companyTimeZone);
  const formatted = new Intl.DateTimeFormat(options.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: options.timeZone,
  }).format(new Date(value));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateTime(
  value: Date | string | number,
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
) {
  const options = formatterOptions(preferences, companyTimeZone);
  return new Intl.DateTimeFormat(options.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.hour12,
    timeZone: options.timeZone,
  }).format(new Date(value));
}

export function formatTime(
  value: Date | string | number,
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
) {
  const options = formatterOptions(preferences, companyTimeZone);
  return new Intl.DateTimeFormat(options.locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.hour12,
    timeZone: options.timeZone,
  }).format(new Date(value));
}

export function formatCurrency(value: number, preferences?: RegionalFormatPreferences | null) {
  return new Intl.NumberFormat(resolveLocale(preferences), {
    style: "currency",
    currency: preferences?.currency || FALLBACK_CURRENCY,
  }).format(value);
}

export function formatNumber(value: number, preferences?: RegionalFormatPreferences | null) {
  return new Intl.NumberFormat(resolveLocale(preferences)).format(value);
}

export function formatPercent(value: number, preferences?: RegionalFormatPreferences | null) {
  return new Intl.NumberFormat(resolveLocale(preferences), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getHourInTimeZone(date: Date, timeZone: string) {
  const hour = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).format(date);
  return Number(hour);
}

export function getGreetingPeriod(hour: number) {
  if (hour >= 5 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 17) return "afternoon";
  return "evening";
}

export function getLocalizedGreeting(
  firstName: string,
  preferences?: RegionalFormatPreferences | null,
  companyTimeZone?: string | null,
  now = new Date(),
) {
  const timeZone = resolveTimeZone(preferences, companyTimeZone);
  const period = getGreetingPeriod(getHourInTimeZone(now, timeZone));
  const locale = resolveLocale(preferences);
  const isPortuguese = locale.toLowerCase().startsWith("pt");
  const base = isPortuguese
    ? period === "morning"
      ? "Bom dia"
      : period === "afternoon"
        ? "Boa tarde"
        : "Boa noite"
    : period === "morning"
      ? "Good morning"
      : period === "afternoon"
        ? "Good afternoon"
        : "Good evening";

  return firstName ? `${base}, ${firstName}!` : base;
}
