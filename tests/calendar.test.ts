import { describe, expect, it } from "vitest";
import { eventsByDate } from "@/lib/calendar";
import { contests } from "@/lib/schema";

describe("eventsByDate", () => {
  it("2026-11: 상호평가 spans 11/12~11/19 (8 dates)", () => {
    const map = eventsByDate(contests, 2026, 11);
    const dates = Object.keys(map).filter((d) =>
      map[d].some((x) => x.event.title.includes("상호평가")),
    );
    expect(dates.sort()).toEqual([
      "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15",
      "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19",
    ]);
  });

  it("2026-12: two events on 12/11 (hana + elice)", () => {
    const map = eventsByDate(contests, 2026, 12);
    const ids = map["2026-12-11"].map((x) => x.contest.id);
    expect(ids).toHaveLength(2);
    expect(ids.some((i) => i.includes("hana"))).toBe(true);
    expect(ids.some((i) => i.includes("elice"))).toBe(true);
  });

  it("2027-01: has 01-11", () => {
    expect(eventsByDate(contests, 2027, 1)["2027-01-11"]?.length).toBeGreaterThan(0);
  });

  it("only includes dates inside the month", () => {
    for (const d of Object.keys(eventsByDate(contests, 2026, 11))) {
      expect(d.startsWith("2026-11-")).toBe(true);
    }
  });
});
