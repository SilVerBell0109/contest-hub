import type { Metadata } from "next";
import { contests } from "@/lib/schema";
import { contestColor } from "@/lib/colors";
import Calendar from "@/components/Calendar";

export const metadata: Metadata = { title: "달력 · contest-hub" };

export default function CalendarPage() {
  const colors = Object.fromEntries(contests.map((c, i) => [c.id, contestColor(i)]));
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <Calendar contests={contests} colors={colors} />
    </main>
  );
}
