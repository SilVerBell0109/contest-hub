import { describe, expect, it } from "vitest";
import { contests, getContest } from "@/lib/schema";

describe("contests data", () => {
  it("7건, id 순서", () => {
    expect(contests.length).toBe(7);
    expect(contests.map((c) => c.id)).toEqual([
      "kic-ai-agent",
      "hana-finance-idea",
      "elice-ai-challenge",
      "hecto-ai-wallet",
      "ax-talent-war",
      "hyundai-vehicle-app",
      "jeju-ai-agent",
    ]);
  });
  it("hecto-ai-wallet 접수 마감 12/21", () => {
    expect(getContest("hecto-ai-wallet")?.events.map((e) => e.date)).toEqual(["2026-12-21"]);
  });
  it("kic 마지막 일정", () => {
    const e = getContest("kic-ai-agent")!.events;
    expect(e[e.length - 1].date).toBe("2027-01-11");
  });
  it("없는 id는 undefined", () => {
    expect(getContest("nope")).toBeUndefined();
  });
});
