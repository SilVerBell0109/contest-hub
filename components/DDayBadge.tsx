"use client";

import type { ContestEvent } from "@/lib/types";
import { ddayLabel, eventStatus, formatKoreanDate } from "@/lib/date";
import { useToday } from "./useToday";

export default function DDayBadge({ event }: { event: ContestEvent }) {
  const today = useToday();
  if (today === null) {
    return <span className="text-sm text-muted">{formatKoreanDate(event.date)}</span>;
  }
  const status = eventStatus(event, today);
  const urgent =
    (status.kind === "upcoming" && status.days <= 3) ||
    (status.kind === "ongoing" && status.daysToEnd <= 3);
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-bold tabular-nums ${
        urgent ? "bg-accent text-[var(--accent-ink)]" : "border border-line text-ink"
      }`}
    >
      {ddayLabel(status)}
    </span>
  );
}
