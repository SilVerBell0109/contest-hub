export type Commit = { sha: string; message: string; date: string; url: string };

export type RepoActivity = {
  fullName: string;
  url: string;
  stars: number;
  openIssues: number;
  pushedAt: string;
  commits: Commit[];
};

export type RepoSummary = {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  pushedAt: string;
  language: string | null;
};

const API = "https://api.github.com";

async function ghFetch(path: string, okStatuses: number[] = []): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { headers, next: { revalidate: 3600 } });
  if (!res.ok) {
    if (okStatuses.includes(res.status)) return null;
    throw new Error(`GitHub ${res.status} ${path}`);
  }
  return res.json();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getRepoActivity(repo: string): Promise<RepoActivity | null> {
  try {
    const [r, c]: any[] = await Promise.all([
      ghFetch(`/repos/${repo}`),
      // 409 = 빈 저장소(커밋 없음). 커밋 목록만 빈 배열로 취급한다.
      ghFetch(`/repos/${repo}/commits?per_page=5`, [409]),
    ]);
    return {
      fullName: r.full_name,
      url: r.html_url,
      stars: r.stargazers_count,
      openIssues: r.open_issues_count,
      pushedAt: r.pushed_at,
      commits: (c ?? []).slice(0, 5).map((x: any) => ({
        sha: x.sha,
        message: String(x.commit.message).split("\n")[0],
        date: x.commit.author.date,
        url: x.html_url,
      })),
    };
  } catch (e) {
    console.warn("getRepoActivity failed", e);
    return null;
  }
}

export async function getRecentRepos(user: string, n = 5): Promise<RepoSummary[] | null> {
  try {
    const perPage = Math.min(n * 2, 30);
    const list: any = await ghFetch(`/users/${user}/repos?sort=pushed&per_page=${perPage}`);
    if (!Array.isArray(list)) throw new Error("unexpected response");
    return list
      .filter((x: any) => !x.fork)
      .slice(0, n)
      .map((x: any) => ({
        name: x.name,
        fullName: x.full_name,
        url: x.html_url,
        description: x.description ?? null,
        pushedAt: x.pushed_at,
        language: x.language ?? null,
      }));
  } catch (e) {
    console.warn("getRecentRepos failed", e);
    return null;
  }
}
