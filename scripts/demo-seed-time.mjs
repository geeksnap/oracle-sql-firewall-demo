export const SOURCE_ANCHOR = "2026-06-01T00:00:00.000Z";

function daysInUtcMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function rebaseTemporal(targetAnchor, temporal) {
  if (temporal == null) return null;
  const target = new Date(targetAnchor);
  if (Number.isNaN(target.getTime())) throw new Error("Invalid target anchor");

  const totalMonth =
    target.getUTCFullYear() * 12 + target.getUTCMonth() + temporal.months;
  const year = Math.floor(totalMonth / 12);
  const month = ((totalMonth % 12) + 12) % 12;
  const maxDay = daysInUtcMonth(year, month);
  const day = temporal.lastDayOfMonth
    ? maxDay
    : Math.min(target.getUTCDate(), maxDay);

  const calendarAdjusted = Date.UTC(
    year,
    month,
    day,
    target.getUTCHours(),
    target.getUTCMinutes(),
    target.getUTCSeconds(),
    target.getUTCMilliseconds(),
  );
  return new Date(
    calendarAdjusted +
      temporal.days * 86_400_000 +
      temporal.milliseconds,
  ).toISOString();
}
