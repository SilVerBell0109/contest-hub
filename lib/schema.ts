import { z } from "zod";
import { STAGES, type Contest } from "./types";
import { rawContests } from "../data/contests";

/** YYYY-MM-DD 형식이면서 실제 존재하는 날짜인지 (2026-02-30 같은 값 거부) */
function isRealDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toISOString().slice(0, 10) === s;
}

const dateStr = z.string().refine(isRealDate, {
  message: "날짜는 실제로 존재하는 YYYY-MM-DD 형식이어야 합니다",
});

const eventSchema = z
  .strictObject({
    title: z.string().min(1),
    date: dateStr,
    end: dateStr.optional(),
    time: z.string().optional(),
  })
  .refine((e) => !e.end || e.end >= e.date, {
    path: ["end"],
    message: "end는 date보다 빠를 수 없습니다",
  });

const taskSchema = z.strictObject({ title: z.string().min(1), done: z.boolean() });

const contestSchema = z
  .strictObject({
    id: z.string().min(1),
    name: z.string().min(1),
    host: z.string().min(1),
    url: z.url().optional(),
    category: z.string().min(1),
    stage: z.enum(STAGES),
    result: z.enum(["수상", "탈락"]).optional(),
    summary: z.string().optional(),
    prize: z.string().optional(),
    team: z.string().optional(),
    events: z.array(eventSchema),
    tasks: z.array(taskSchema),
    repo: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, "repo는 owner/name 형식이어야 합니다")
      .optional(),
    notes: z.string().optional(),
  })
  .refine((c) => c.result === undefined || c.stage === "종료", {
    path: ["result"],
    message: 'result는 stage가 "종료"일 때만 쓸 수 있습니다',
  });

/** 실패 시 어떤 대회(id)의 어떤 필드가 문제인지 담아 throw */
export function parseContests(raw: unknown): Contest[] {
  const parsed = z.array(contestSchema).safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => {
      const [idx, ...rest] = issue.path;
      const id =
        typeof idx === "number" && Array.isArray(raw)
          ? (raw[idx] as { id?: unknown } | undefined)?.id
          : undefined;
      const where = [`contests[${String(idx)}]`, ...rest.map(String)].join(".");
      return `- ${typeof id === "string" ? `[${id}] ` : ""}${where}: ${issue.message}`;
    });
    throw new Error(`contests 데이터 오류:\n${lines.join("\n")}`);
  }
  const seen = new Set<string>();
  for (const c of parsed.data) {
    if (seen.has(c.id)) throw new Error(`contests 데이터 오류: id 중복 [${c.id}]`);
    seen.add(c.id);
  }
  return parsed.data;
}

export const contests: Contest[] = parseContests(rawContests);

export function getContest(id: string): Contest | undefined {
  return contests.find((c) => c.id === id);
}
