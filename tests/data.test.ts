import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contests, getContest } from "@/lib/schema";

describe("contests data", () => {
  it("5건, id 순서", () => {
    expect(contests.length).toBe(5);
    expect(contests.map((c) => c.id)).toEqual([
      "kic-ai-agent",
      "hana-finance-idea",
      "hecto-ai-wallet",
      "hyundai-vehicle-app",
      "jeju-ai-agent",
    ]);
  });
  it("hecto-ai-wallet 예선 기획서 마감 12/21", () => {
    expect(getContest("hecto-ai-wallet")?.events.map((e) => e.date)).toEqual([
      "2026-12-21", "2026-12-25", "2027-02-19",
    ]);
  });
  it("kic 마지막 일정", () => {
    const e = getContest("kic-ai-agent")!.events;
    expect(e[e.length - 1].date).toBe("2027-01-11");
  });
  it("files는 자기 대회 폴더 아래에 실제로 있는 파일", () => {
    for (const c of contests) {
      for (const f of c.files ?? []) {
        expect(f.path.startsWith(`/files/${c.id}/`), f.path).toBe(true);
        expect(existsSync(join(process.cwd(), "public", f.path)), f.path).toBe(true);
      }
    }
  });
  it("제출물 파일: 제주 2개, KIC 1개", () => {
    expect(getContest("jeju-ai-agent")?.files).toHaveLength(2);
    expect(getContest("kic-ai-agent")?.files).toHaveLength(1);
  });
  it("없는 id는 undefined", () => {
    expect(getContest("nope")).toBeUndefined();
  });
});
