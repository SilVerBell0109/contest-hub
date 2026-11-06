import type { RepoSummary } from "@/lib/github";

export default function RecentRepos({ repos }: { repos: RepoSummary[] | null }) {
  if (repos === null) {
    return <p className="text-sm text-muted">GitHub 활동을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>;
  }
  if (repos.length === 0) {
    return <p className="text-sm text-muted">최근 활동한 저장소가 없습니다.</p>;
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {repos.map((r) => (
        <li key={r.fullName}>
          <a href={r.url} className="block py-2.5 hover:bg-surface">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-bold">{r.name}</span>
              <span className="shrink-0 text-xs text-muted">
                {r.language ? `${r.language} · ` : ""}
                {r.pushedAt.slice(0, 10)}
              </span>
            </span>
            {r.description && <span className="block truncate text-xs text-muted">{r.description}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
