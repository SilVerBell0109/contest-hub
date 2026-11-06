import { describe, expect, it } from "vitest";
import { contests, getContest } from "@/lib/schema";

describe("contests data", () => {
  it("4건, id 순서", () => {
    expect(contests.length).toBe(4);
    expect(contests.map((c) => c.id)).toEqual([
      "kic-ai-agent",
      "hana-finance-idea",
      "elice-ai-challenge",
      "hecto-ai-wallet",
    ]);
  });
  it("hecto-ai-wallet 일정 없음", () => {
    expect(getContest("hecto-ai-wallet")?.events).toHaveLength(0);
  });
  it("kic 마지막 일정", () => {
    const e = getContest("kic-ai-agent")!.events;
    expect(e[e.length - 1].date).toBe("2027-01-11");
  });
  it("없는 id는 undefined", () => {
    expect(getContest("nope")).toBeUndefined();
  });
});
