export function detectBrowserLanguage() {
  if (typeof navigator === "undefined") return "pt-BR";
  return navigator.language || "pt-BR";
}

export function detectTimeZone() {
  if (typeof Intl === "undefined") return "America/Sao_Paulo";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

export function getSiteUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
