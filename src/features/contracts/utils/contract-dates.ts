function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addMonthsClamped(isoDate: string, months: number) {
  const parsed = parseIsoDate(isoDate);
  if (!parsed || !Number.isInteger(months) || months < 0) return "";

  const sourceDay = parsed.getUTCDate();
  const targetYear = parsed.getUTCFullYear();
  const targetMonth = parsed.getUTCMonth() + months;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(sourceDay, lastDayOfTargetMonth);

  return formatIsoDate(new Date(Date.UTC(targetYear, targetMonth, clampedDay)));
}

export function calculateMinimumTermEndDate(
  startDate: string | null | undefined,
  minimumTermMonths: number | string | null | undefined,
) {
  const months = Number(minimumTermMonths ?? 0);
  if (!startDate || !Number.isInteger(months) || months <= 0) return "";
  return addMonthsClamped(startDate, months);
}

export function calculateContractTermDates(input: {
  startsAt: string | null | undefined;
  loyaltyMonths: number | string | null | undefined;
  autoRenew?: boolean | null | undefined;
}) {
  const minimumTermEndDate = calculateMinimumTermEndDate(input.startsAt, input.loyaltyMonths);

  return {
    minimumTermEndDate,
    renewalDate: input.autoRenew === false ? "" : minimumTermEndDate,
  };
}
