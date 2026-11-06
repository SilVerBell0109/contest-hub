import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRecentRepos, getRepoActivity } from "@/lib/github";

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) });

const repoBody = {
  full_name: "SilVerBell0109/contest-hub",
  html_url: "https://github.com/SilVerBell0109/contest-hub",
  stargazers_count: 3,
  open_issues_count: 2,
  pushed_at: "2026-11-05T10:00:00Z",
};
const commitsBody = [
  {
    sha: "abc123",
    html_url: "https://github.com/SilVerBell0109/contest-hub/commit/abc123",
    commit: { message: "feat: 첫 줄\n\n본문", author: { date: "2026-11-05T09:00:00Z" } },
  },
];

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  delete process.env.GITHUB_TOKEN;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GITHUB_TOKEN;
});

function stubRepoFetch() {
  const mock = vi.fn(async (url: string) =>
    String(url).includes("/commits") ? ok(commitsBody) : ok(repoBody),
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("getRepoActivity", () => {
  it("maps fields and keeps only the first line of the commit message", async () => {
    stubRepoFetch();
    expect(await getRepoActivity("SilVerBell0109/contest-hub")).toEqual({
      fullName: "SilVerBell0109/contest-hub",
      url: "https://github.com/SilVerBell0109/contest-hub",
      stars: 3,
      openIssues: 2,
      pushedAt: "2026-11-05T10:00:00Z",
      commits: [
        {
          sha: "abc123",
          message: "feat: 첫 줄",
          date: "2026-11-05T09:00:00Z",
          url: "https://github.com/SilVerBell0109/contest-hub/commit/abc123",
        },
      ],
    });
  });

  it("requests both endpoints with revalidate and Accept header", async () => {
    const mock = stubRepoFetch();
    await getRepoActivity("o/r");
    const urls = mock.mock.calls.map((c) => String(c[0]));
    expect(urls).toContain("https://api.github.com/repos/o/r");
    expect(urls).toContain("https://api.github.com/repos/o/r/commits?per_page=5");
    for (const call of mock.mock.calls as unknown[][]) {
      const init = call[1] as { headers: Record<string, string>; next: unknown };
      expect(init.next).toEqual({ revalidate: 3600 });
      expect(init.headers.Accept).toBe("application/vnd.github+json");
    }
  });

  it.each([403, 404])("returns null on %i", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => fail(status)));
    expect(await getRepoActivity("o/r")).toBeNull();
  });

  it("returns null when only the commits request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => (String(url).includes("/commits") ? fail(500) : ok(repoBody))),
    );
    expect(await getRepoActivity("o/r")).toBeNull();
  });

  it("returns null when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await getRepoActivity("o/r")).toBeNull();
  });

  it("returns null on malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new Error("bad"); } })),
    );
    expect(await getRepoActivity("o/r")).toBeNull();
  });

  it("sends Authorization only when GITHUB_TOKEN is set", async () => {
    const mock = stubRepoFetch();
    await getRepoActivity("o/r");
    const headers0 = (mock.mock.calls[0] as unknown[])[1] as { headers: Record<string, string> };
    expect(headers0.headers).not.toHaveProperty("Authorization");

    process.env.GITHUB_TOKEN = "t";
    mock.mockClear();
    await getRepoActivity("o/r");
    for (const call of mock.mock.calls as unknown[][]) {
      expect((call[1] as { headers: Record<string, string> }).headers.Authorization).toBe("Bearer t");
    }
  });
});

describe("getRecentRepos", () => {
  const repo = (name: string, fork = false) => ({
    name,
    full_name: `u/${name}`,
    html_url: `https://github.com/u/${name}`,
    description: null,
    pushed_at: "2026-11-05T10:00:00Z",
    language: "TypeScript",
    fork,
  });

  it("excludes forks, maps fields and slices to n", async () => {
    const mock = vi.fn(async () => ok([repo("a"), repo("f", true), repo("b"), repo("c")]));
    vi.stubGlobal("fetch", mock);
    const res = await getRecentRepos("u", 2);
    expect(res).toEqual([
      {
        name: "a",
        fullName: "u/a",
        url: "https://github.com/u/a",
        description: null,
        pushedAt: "2026-11-05T10:00:00Z",
        language: "TypeScript",
      },
      expect.objectContaining({ name: "b" }),
    ]);
    expect(String((mock.mock.calls[0] as unknown[])[0])).toBe(
      "https://api.github.com/users/u/repos?sort=pushed&per_page=4",
    );
  });

  it("defaults n to 5 and caps per_page at 30", async () => {
    const mock = vi.fn(async () => ok([]));
    vi.stubGlobal("fetch", mock);
    await getRecentRepos("u");
    expect(String((mock.mock.calls[0] as unknown[])[0])).toContain("per_page=10");
    await getRecentRepos("u", 50);
    expect(String((mock.mock.calls[1] as unknown[])[0])).toContain("per_page=30");
  });

  it("returns null on 403 and on reject", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fail(403)));
    expect(await getRecentRepos("u")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("x"); }));
    expect(await getRecentRepos("u")).toBeNull();
  });

  it("returns null when the body is not an array", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok({ message: "x" })));
    expect(await getRecentRepos("u")).toBeNull();
  });

  it("sends Authorization when GITHUB_TOKEN is set", async () => {
    process.env.GITHUB_TOKEN = "t";
    const mock = vi.fn(async () => ok([]));
    vi.stubGlobal("fetch", mock);
    await getRecentRepos("u");
    expect(((mock.mock.calls[0] as unknown[])[1] as { headers: Record<string, string> }).headers.Authorization).toBe("Bearer t");
  });
});
