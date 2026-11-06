import { getRepoActivity } from "@/lib/github";

export default async function RepoActivity({ repo }: { repo: string }) {
  const a = await getRepoActivity(repo);
  if (a === null) {
    return <p className="text-sm text-muted">GitHub 정보를 불러오지 못했습니다</p>;
  }
  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline">
          {a.fullName}
        </a>
        {" · "}최근 푸시 {a.pushedAt.slice(0, 10)} · 열린 이슈 {a.openIssues} · 별 {a.stars}
      </p>
      {a.commits.length === 0 ? (
        <p className="text-sm text-muted">커밋이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {a.commits.map((c) => (
            <li key={c.sha}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-baseline justify-between gap-3 py-2.5 hover:bg-surface">
                <span className="truncate text-sm">{c.message}</span>
                <span className="shrink-0 text-xs text-muted">{c.date.slice(0, 10)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
