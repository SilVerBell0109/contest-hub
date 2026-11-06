"use client";

import type { ContestEvent } from "@/lib/types";
import { eventStatus, formatKoreanDate } from "@/lib/date";
import DDayBadge from "./DDayBadge";
import { useToday } from "./useToday";

export default function Timeline({ events, color }: { events: ContestEvent[]; color: string }) {
  const today = useToday();
  if (events.length === 0) {
    return <p className="text-sm text-muted">등록된 일정 없음</p>;
  }
  return (
    <ol className="divide-y divide-line border-y border-line">
      {events.map((e, i) => {
        const past = today !== null && eventStatus(e, today).kind === "past";
        return (
          <li
            key={`${e.date}-${e.title}-${i}`}
            className={`flex items-center gap-3 py-2.5 ${past ? "opacity-50" : ""}`}
          >
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{e.title}</span>
              <span className="block text-xs text-muted">
                {formatKoreanDate(e.date)}
                {e.end ? ` ~ ${formatKoreanDate(e.end)}` : ""}
                {e.time ? ` ${e.time}` : ""}
              </span>
            </span>
            {today !== null && <DDayBadge event={e} />}
          </li>
        );
      })}
    </ol>
  );
}
