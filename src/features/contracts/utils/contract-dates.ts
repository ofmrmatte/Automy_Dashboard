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

export function calculateContractTermDates(input: {
  startsAt: string | null | undefined;
  loyaltyMonths: number | null | undefined;
  autoRenew?: boolean | null | undefined;
}) {
  const minimumTermMonths = Number(input.loyaltyMonths ?? 0);
  const minimumTermEndDate =
    input.startsAt && minimumTermMonths > 0
      ? addMonthsClamped(input.startsAt, minimumTermMonths)
      : "";

  return {
    minimumTermEndDate,
    renewalDate: input.autoRenew === false ? "" : minimumTermEndDate,
  };
}
