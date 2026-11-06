import type { Contest, ContestEvent, Task } from "./types";

const MS_DAY = 86_400_000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fmt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Asia/Seoul 기준 오늘 (YYYY-MM-DD) */
export function todayKST(now: Date = new Date()): string {
  return fmt(now.getTime() + 9 * 3_600_000);
}

/** to - from, 일 단위 */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / MS_DAY);
}

export type EventStatus =
  | { kind: "upcoming"; days: number }
  | { kind: "ongoing"; daysToEnd: number }
  | { kind: "past" };

export function eventStatus(e: ContestEvent, today: string): EventStatus {
  const end = e.end ?? e.date;
  if (today > end) return { kind: "past" };
  if (today >= e.date && e.end) {
    return { kind: "ongoing", daysToEnd: daysBetween(today, e.end) };
  }
  return { kind: "upcoming", days: daysBetween(today, e.date) };
}

export type UpcomingItem = {
  contest: Contest;
  event: ContestEvent;
  status: EventStatus;
};

function sortKey(i: UpcomingItem, today: string): string {
  return i.status.kind === "ongoing" ? today : i.event.date;
}

export function upcomingEvents(
  contests: Contest[],
  today: string,
  limit?: number,
): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const contest of contests) {
    for (const event of contest.events) {
      const status = eventStatus(event, today);
      if (status.kind !== "past") items.push({ contest, event, status });
    }
  }
  // Array.prototype.sort는 안정 정렬이라 같으면 입력 순서가 유지된다.
  items.sort((a, b) => {
    const ka = sortKey(a, today);
    const kb = sortKey(b, today);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  return limit === undefined ? items : items.slice(0, limit);
}

export function nextEvent(contest: Contest, today: string): UpcomingItem | null {
  return upcomingEvents([contest], today, 1)[0] ?? null;
}

/** month 1~12, 일요일 시작, 7칸 주 단위, 빈칸 null */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = Date.UTC(year, month - 1, 1);
  const lead = new Date(first).getUTCDay();
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 0; d < dim; d++) cells.push(fmt(first + d * MS_DAY));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function eventsOnDate(
  contests: Contest[],
  date: string,
): { contest: Contest; event: ContestEvent }[] {
  const out: { contest: Contest; event: ContestEvent }[] = [];
  for (const contest of contests) {
    for (const event of contest.events) {
      if (event.date <= date && date <= (event.end ?? event.date)) {
        out.push({ contest, event });
      }
    }
  }
  return out;
}

export function progress(tasks: Task[]): number | null {
  if (tasks.length === 0) return null;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

export function formatKoreanDate(date: string): string {
  const d = new Date(toUTC(date));
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
}

export function ddayLabel(s: EventStatus): string {
  switch (s.kind) {
    case "upcoming":
      return s.days === 0 ? "D-DAY" : `D-${s.days}`;
    case "ongoing":
      return s.daysToEnd === 0 ? "진행 중 · 오늘 종료" : `진행 중 · 종료 D-${s.daysToEnd}`;
    case "past":
      return "종료";
  }
}
