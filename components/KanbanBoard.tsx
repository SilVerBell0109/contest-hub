import { STAGES, type Contest } from "@/lib/types";
import ContestCard from "./ContestCard";

export default function KanbanBoard({ contests, colors }: { contests: Contest[]; colors: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-3">
      {STAGES.map((stage) => {
        const items = contests.filter((c) => c.stage === stage);
        return (
          <section key={stage} aria-labelledby={`col-${stage}`} className="min-w-0">
            <h3
              id={`col-${stage}`}
              className="mb-2 flex items-baseline justify-between border-b border-ink pb-1 text-sm font-bold"
            >
              {stage}
              <span className="text-xs font-normal tabular-nums text-muted">{items.length}</span>
            </h3>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
                  비어 있음
                </p>
              ) : (
                items.map((c) => <ContestCard key={c.id} contest={c} color={colors[c.id]} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
