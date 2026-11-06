import { describe, expect, it } from "vitest";
import {
  ddayLabel,
  daysBetween,
  eventStatus,
  eventsOnDate,
  formatKoreanDate,
  monthGrid,
  nextEvent,
  progress,
  todayKST,
  upcomingEvents,
} from "@/lib/date";
import type { Contest } from "@/lib/types";

const c = (id: string, events: Contest["events"]): Contest => ({
  id,
  name: id,
  host: "h",
  category: "x",
  stage: "준비중",
  events,
  tasks: [],
});

describe("todayKST", () => {
  it("converts UTC to KST date", () => {
    expect(todayKST(new Date("2026-11-05T15:30:00Z"))).toBe("2026-11-06");
    expect(todayKST(new Date("2026-11-06T14:59:00Z"))).toBe("2026-11-06");
  });
});

describe("daysBetween", () => {
  it("counts days", () => {
    expect(daysBetween("2026-12-29", "2027-01-11")).toBe(13);
    expect(daysBetween("2026-11-06", "2026-11-06")).toBe(0);
    expect(daysBetween("2026-11-07", "2026-11-06")).toBe(-1);
  });
});

describe("eventStatus", () => {
  const e = { title: "x", date: "2026-11-12", end: "2026-11-19" };
  it("ongoing / past / upcoming", () => {
    expect(eventStatus(e, "2026-11-19")).toEqual({ kind: "ongoing", daysToEnd: 0 });
    expect(eventStatus(e, "2026-11-20")).toEqual({ kind: "past" });
    expect(eventStatus(e, "2026-11-06")).toEqual({ kind: "upcoming", days: 6 });
  });
  it("single-day event is upcoming 0 on its date", () => {
    expect(eventStatus({ title: "x", date: "2026-11-12" }, "2026-11-12")).toEqual({
      kind: "upcoming",
      days: 0,
    });
  });
});

describe("upcomingEvents", () => {
  const list = [
    c("empty", []),
    c("future", [{ title: "f", date: "2026-11-10" }]),
    c("going", [{ title: "g", date: "2026-11-01", end: "2026-11-30" }]),
    c("old", [{ title: "o", date: "2026-10-01" }]),
  ];
  it("excludes past, orders ongoing first, tolerates no events", () => {
    const r = upcomingEvents(list, "2026-11-06");
    expect(r.map((i) => i.contest.id)).toEqual(["going", "future"]);
  });
  it("applies limit", () => {
    expect(upcomingEvents(list, "2026-11-06", 1)).toHaveLength(1);
  });
  it("keeps input order on ties", () => {
    const r = upcomingEvents(
      [c("a", [{ title: "1", date: "2026-11-10" }]), c("b", [{ title: "2", date: "2026-11-10" }])],
      "2026-11-06",
    );
    expect(r.map((i) => i.contest.id)).toEqual(["a", "b"]);
  });
});

describe("nextEvent", () => {
  it("returns first upcoming or null", () => {
    const k = c("k", [
      { title: "late", date: "2026-12-01" },
      { title: "soon", date: "2026-11-10" },
    ]);
    expect(nextEvent(k, "2026-11-06")?.event.title).toBe("soon");
    expect(nextEvent(c("e", []), "2026-11-06")).toBeNull();
  });
});

describe("monthGrid", () => {
  it("builds Sunday-start weeks", () => {
    const g = monthGrid(2026, 11);
    expect(g[0][0]).toBe("2026-11-01");
    expect(g[g.length - 1]).toContain("2026-11-30");
    expect(g.every((row) => row.length === 7)).toBe(true);
  });
  it("pads with null", () => {
    const g = monthGrid(2026, 12);
    expect(g[0]).toEqual([null, null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05"]);
  });
});

describe("eventsOnDate", () => {
  it("includes range days", () => {
    const k = c("k", [{ title: "r", date: "2026-11-10", end: "2026-11-12" }]);
    expect(eventsOnDate([k], "2026-11-11")).toHaveLength(1);
    expect(eventsOnDate([k], "2026-11-13")).toHaveLength(0);
  });
});

describe("progress", () => {
  it("rounds percent", () => {
    expect(progress([])).toBeNull();
    expect(
      progress([
        { title: "a", done: true },
        { title: "b", done: false },
        { title: "c", done: false },
      ]),
    ).toBe(33);
  });
});

describe("labels", () => {
  it("ddayLabel", () => {
    expect(ddayLabel({ kind: "upcoming", days: 0 })).toBe("D-DAY");
    expect(ddayLabel({ kind: "upcoming", days: 5 })).toBe("D-5");
    expect(ddayLabel({ kind: "ongoing", daysToEnd: 3 })).toBe("진행 중 · 종료 D-3");
    expect(ddayLabel({ kind: "ongoing", daysToEnd: 0 })).toBe("진행 중 · 오늘 종료");
    expect(ddayLabel({ kind: "past" })).toBe("종료");
  });
  it("formatKoreanDate", () => {
    expect(formatKoreanDate("2026-11-12")).toBe("11월 12일 (목)");
  });
});
