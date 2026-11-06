import type { Contest, ContestEvent } from "./types";
import { eventsOnDate, monthGrid } from "./date";

export type DayEvent = { contest: Contest; event: ContestEvent };

/** 해당 월의 날짜(YYYY-MM-DD) → 그날의 일정. 일정이 없는 날짜는 키가 없다. */
export function eventsByDate(
  contests: Contest[],
  year: number,
  month: number,
): Record<string, DayEvent[]> {
  const out: Record<string, DayEvent[]> = {};
  for (const week of monthGrid(year, month)) {
    for (const date of week) {
      if (!date) continue;
      const events = eventsOnDate(contests, date);
      if (events.length > 0) out[date] = events;
    }
  }
  return out;
}
