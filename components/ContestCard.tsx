"use client";

import Link from "next/link";
import type { Contest } from "@/lib/types";
import { contests } from "@/lib/schema";
import { contestColor } from "@/lib/colors";
import { nextEvent, progress } from "@/lib/date";
import DDayBadge from "./DDayBadge";
import ProgressBar from "./ProgressBar";
import { useToday } from "./useToday";

export default function ContestCard({ contest }: { contest: Contest }) {
  const today = useToday();
  const color = contestColor(contests.findIndex((c) => c.id === contest.id));
  const pct = progress(contest.tasks);
  // 마운트 전에는 오늘을 모르므로 가장 이른 일정의 날짜만 보여 준다.
  const next = today === null ? (contest.events[0] ? { event: contest.events[0] } : null) : nextEvent(contest, today);

  return (
    <Link
      href={`/projects/${contest.id}`}
      style={{ borderTopColor: color }}
      className="block rounded-md border border-line border-t-4 bg-surface p-3 hover:border-ink"
    >
      <h3 className="text-sm font-bold leading-snug">{contest.name}</h3>
      <p className="mt-0.5 text-xs text-muted">{contest.host}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {next ? (
          <>
            <DDayBadge event={next.event} />
            <span className="truncate text-muted">{next.event.title}</span>
          </>
        ) : (
          <span className="text-muted">일정 없음</span>
        )}
      </div>
      {contest.stage === "종료" && contest.result && (
        <p className="mt-2 text-xs font-bold">{contest.result}</p>
      )}
      {pct !== null && (
        <div className="mt-2">
          <ProgressBar value={pct} />
        </div>
      )}
      {contest.repo && <p className="mt-2 truncate text-xs text-muted">{contest.repo}</p>}
    </Link>
  );
}
