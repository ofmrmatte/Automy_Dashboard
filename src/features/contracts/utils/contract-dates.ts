type ContractDateInput = Date | string | null | undefined;

function parseIsoDate(value: ContractDateInput) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addMonthsClamped(date: ContractDateInput, months: number) {
  const parsed = parseIsoDate(date);
  if (!parsed || !Number.isInteger(months) || months < 0) return "";

  const sourceDay = parsed.getUTCDate();
  const targetYear = parsed.getUTCFullYear();
  const targetMonth = parsed.getUTCMonth() + months;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(sourceDay, lastDayOfTargetMonth);

  return formatIsoDate(new Date(Date.UTC(targetYear, targetMonth, clampedDay)));
}

export function calculateMinimumTermEndDate(
  startDate: ContractDateInput,
  minimumTermMonths: number | string | null | undefined,
) {
  const months = Number(minimumTermMonths ?? 0);
  if (!startDate || !Number.isInteger(months) || months <= 0) return "";
  return addMonthsClamped(startDate, months);
}

export function calculateContractTermDates(input: {
  startsAt: ContractDateInput;
  loyaltyMonths: number | string | null | undefined;
  autoRenew?: boolean | null | undefined;
}) {
  const minimumTermEndDate = calculateMinimumTermEndDate(input.startsAt, input.loyaltyMonths);

  return {
    minimumTermEndDate,
    renewalDate: input.autoRenew === false ? "" : minimumTermEndDate,
  };
}
