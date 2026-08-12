// schedules.start_time/end_time are stored as literal wall-clock values with a
// trailing "Z" (see CreateScheduleForm.jsx), not real UTC instants. Reading them
// back with plain local Date getters/comparisons re-applies the browser's
// timezone offset, shifting the displayed day/time and any "is now within this
// shift" checks -- so re-interpret the UTC components as if they were local
// components instead.
export function literalDateFromIso(isoString) {
  const parsed = new Date(isoString);

  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
    parsed.getUTCHours(),
    parsed.getUTCMinutes(),
    parsed.getUTCSeconds()
  );
}
