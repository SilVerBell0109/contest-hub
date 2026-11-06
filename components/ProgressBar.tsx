export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label="준비 진행률"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--track)]"
      >
        <div className="h-full rounded-full bg-[var(--fill)]" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted">{value}%</span>
    </div>
  );
}
