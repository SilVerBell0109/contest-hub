"use client";

import Link from "next/link";
import type { Contest } from "@/lib/types";
import { contestColor } from "@/lib/colors";
import { formatKoreanDate, upcomingEvents } from "@/lib/date";
import DDayBadge from "./DDayBadge";
import { useToday } from "./useToday";

export default function UpcomingList({ contests, limit = 8 }: { contests: Contest[]; limit?: number }) {
  const today = useToday();
  if (today === null) {
    return <p className="text-sm text-muted">일정을 불러오는 중…</p>;
  }
  const items = upcomingEvents(contests, today, limit);
  if (items.length === 0) {
    return <p className="text-sm text-muted">다가오는 일정이 없습니다.</p>;
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map(({ contest, event }) => (
        <li key={`${contest.id}-${event.title}-${event.date}`}>
          <Link
            href={`/projects/${contest.id}`}
            className="flex items-center gap-3 py-2.5 hover:bg-surface"
          >
            <span
              aria-hidden
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ background: contestColor(contests.findIndex((c) => c.id === contest.id)) }}
            />
            <span className="w-16 shrink-0">
              <DDayBadge event={event} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{event.title}</span>
              <span className="block truncate text-xs text-muted">
                {contest.name} · {formatKoreanDate(event.date)}
                {event.time ? ` ${event.time}` : ""}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
