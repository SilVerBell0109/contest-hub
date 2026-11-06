"use client";

import Link from "next/link";
import type { Contest } from "@/lib/types";
import { nextEvent, progress } from "@/lib/date";
import DDayBadge from "./DDayBadge";
import ProgressBar from "./ProgressBar";
import { useToday } from "./useToday";

export default function ContestCard({ contest, color }: { contest: Contest; color: string }) {
  const today = useToday();
  const pct = progress(contest.tasks);
  const next = today === null ? null : nextEvent(contest, today);

  return (
    <Link
      href={`/projects/${contest.id}`}
      style={{ borderTopColor: color }}
      className="block rounded-md border border-line border-t-4 bg-surface p-3 hover:border-ink"
    >
      <h3 className="text-sm font-bold leading-snug">{contest.name}</h3>
      <p className="mt-0.5 text-xs text-muted">{contest.host}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {today === null ? (
          <span className="text-muted">다음 일정</span>
        ) : next ? (
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
