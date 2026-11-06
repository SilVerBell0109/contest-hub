"use client";

import Link from "next/link";
import { useState } from "react";
import type { Contest } from "@/lib/types";
import { formatKoreanDate, monthGrid } from "@/lib/date";
import { eventsByDate, type DayEvent } from "@/lib/calendar";
import { useToday } from "./useToday";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const btn =
  "rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:border-ink";

function shortLabel(name: string): string {
  return name.length > 8 ? `${name.slice(0, 8)}…` : name;
}

function Chip({
  item,
  color,
  full,
}: {
  item: DayEvent;
  color: string;
  full?: boolean;
}) {
  const { contest, event } = item;
  return (
    <Link
      href={`/projects/${contest.id}`}
      title={`${contest.name} · ${event.title}`}
      style={{ borderLeftColor: color, color }}
      className="block truncate rounded-sm border-l-4 bg-bg px-1.5 py-0.5 text-xs font-bold hover:bg-line"
    >
      {shortLabel(contest.name)}
      {full && <span className="font-normal text-ink"> · {event.title}</span>}
    </Link>
  );
}

export default function Calendar({
  contests,
  colors,
}: {
  contests: Contest[];
  colors: Record<string, string>;
}) {
  const today = useToday();
  const [offset, setOffset] = useState<{ year: number; month: number } | null>(null);

  if (today === null) {
    return (
      <section aria-label="월 달력">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">달력</h1>
        </div>
        <p className="text-sm text-muted">달력을 불러오는 중…</p>
      </section>
    );
  }

  const cur = offset ?? { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  const { year, month } = cur;
  const go = (delta: number) => {
    const idx = year * 12 + (month - 1) + delta;
    setOffset({ year: Math.floor(idx / 12), month: (idx % 12) + 1 });
  };
  const grid = monthGrid(year, month);
  const byDate = eventsByDate(contests, year, month);
  const eventDates = Object.keys(byDate).sort();

  return (
    <section aria-label="월 달력">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-black tracking-tight">
          {year}년 {month}월
        </h1>
        <button type="button" className={btn} onClick={() => go(-1)} aria-label="이전 달">
          ‹ 이전
        </button>
        <button type="button" className={btn} onClick={() => setOffset(null)}>
          오늘
        </button>
        <button type="button" className={btn} onClick={() => go(1)} aria-label="다음 달">
          다음 ›
        </button>
      </div>

      {/* 모바일: 일정 있는 날짜만 */}
      <div className="sm:hidden">
        {eventDates.length === 0 ? (
          <p className="text-sm text-muted">이 달에는 일정이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {eventDates.map((date) => (
              <li key={date} className="py-2.5">
                <p
                  className={`mb-1 text-sm font-bold ${date === today ? "text-accent" : ""}`}
                >
                  {formatKoreanDate(date)}
                  {date === today && " · 오늘"}
                </p>
                <div className="flex flex-col gap-1">
                  {byDate[date].map((it) => (
                    <Chip
                      key={`${it.contest.id}-${it.event.title}-${it.event.date}`}
                      item={it}
                      color={colors[it.contest.id]}
                      full
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 데스크톱: 월 그리드 */}
      <div className="hidden overflow-hidden rounded-md border border-line sm:block">
        <div className="grid grid-cols-7 border-b border-line bg-surface text-center text-xs font-bold">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`py-1.5 ${i === 0 ? "text-accent" : i === 6 ? "text-[var(--c-1)]" : ""}`}
            >
              {w}
            </div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {week.map((date, di) => {
              const isToday = date === today;
              const tint = di === 0 || di === 6 ? "bg-surface" : "";
              return (
                <div
                  key={di}
                  className={`min-h-24 min-w-0 border-r border-line p-1 last:border-r-0 ${
                    date ? tint : "bg-surface opacity-50"
                  }`}
                >
                  {date && (
                    <>
                      <span
                        className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs ${
                          isToday ? "bg-accent font-bold text-[var(--accent-ink)]" : "text-muted"
                        }`}
                        {...(isToday ? { "aria-current": "date" as const } : {})}
                      >
                        {Number(date.slice(8))}
                      </span>
                      <div className="flex flex-col gap-1">
                        {(byDate[date] ?? []).map((it) => (
                          <Chip
                            key={`${it.contest.id}-${it.event.title}-${it.event.date}`}
                            item={it}
                            color={colors[it.contest.id]}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
