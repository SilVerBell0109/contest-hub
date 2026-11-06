import { describe, expect, it } from "vitest";
import { parseContests } from "@/lib/schema";

const base = {
  id: "a-b",
  name: "대회",
  host: "주최",
  category: "AI",
  stage: "준비중",
  events: [{ title: "마감", date: "2026-11-12" }],
  tasks: [{ title: "작업", done: false }],
};
const one = (patch: object) => parseContests([{ ...base, ...patch }]);

describe("parseContests", () => {
  it("정상 1건 통과", () => {
    expect(parseContests([base])).toHaveLength(1);
  });
  it("존재하지 않는 달/일 거부", () => {
    expect(() => one({ events: [{ title: "x", date: "2026-13-01" }] })).toThrow(/a-b/);
    expect(() => one({ events: [{ title: "x", date: "2026-02-30" }] })).toThrow();
  });
  it("YYYY-MM-DD 아닌 형식 거부", () => {
    expect(() => one({ events: [{ title: "x", date: "2026/11/12" }] })).toThrow();
  });
  it("end < date 거부, 같은 날은 허용", () => {
    expect(() => one({ events: [{ title: "x", date: "2026-11-12", end: "2026-11-11" }] })).toThrow();
    expect(() => one({ events: [{ title: "x", date: "2026-11-12", end: "2026-11-12" }] })).not.toThrow();
  });
  it("id 중복 거부", () => {
    expect(() => parseContests([base, base])).toThrow(/a-b/);
  });
  it("result는 종료 단계에서만", () => {
    expect(() => one({ stage: "준비중", result: "수상" })).toThrow();
    expect(() => one({ stage: "종료", result: "수상" })).not.toThrow();
  });
  it("repo 형식 owner/name", () => {
    expect(() => one({ repo: "no-slash" })).toThrow();
    expect(() => one({ repo: "SilVerBell0109/x" })).not.toThrow();
  });
  it("url은 URL 형식", () => {
    expect(() => one({ url: "not a url" })).toThrow();
    expect(() => one({ url: "https://example.com" })).not.toThrow();
  });
  it("알 수 없는 stage 거부", () => {
    expect(() => one({ stage: "없음" })).toThrow();
  });
  it("오타 키(prise)는 unrecognized로 거부", () => {
    expect(() => one({ prise: "100만원" })).toThrow(/- \[a-b\] contests\[0\].*(prise|nrecognized)/);
  });
  it("event/task의 알 수 없는 키도 거부", () => {
    expect(() => one({ events: [{ title: "x", date: "2026-11-12", tiem: "10:00" }] })).toThrow(/unrecognized|Unrecognized/i);
    expect(() => one({ tasks: [{ title: "x", done: false, dnoe: true }] })).toThrow(/unrecognized|Unrecognized/i);
  });
});
