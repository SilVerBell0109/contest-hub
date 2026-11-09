import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contests, getContest } from "@/lib/schema";
import { contestColor } from "@/lib/colors";
import { progress } from "@/lib/date";
import ProgressBar from "@/components/ProgressBar";
import RepoActivity from "@/components/RepoActivity";
import Timeline from "@/components/Timeline";

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return contests.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = getContest(id);
  if (!c) return {};
  return { title: `${c.name} · contest-hub`, ...(c.summary ? { description: c.summary } : {}) };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const c = getContest(id);
  if (!c) notFound();
  const color = contestColor(contests.findIndex((x) => x.id === c.id));
  const pct = progress(c.tasks);

  const info: [string, React.ReactNode][] = [["주최", c.host], ["분야", c.category]];
  if (c.prize) info.push(["상금", c.prize]);
  if (c.team) info.push(["팀", c.team]);
  if (c.url) {
    info.push([
      "공식 링크",
      <a key="url" href={c.url} target="_blank" rel="noopener noreferrer" className="underline">
        {c.url}
      </a>,
    ]);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 border-l-4 pl-3" style={{ borderColor: color }}>
        <p className="text-xs text-muted">
          {c.stage}
          {c.stage === "종료" && c.result ? ` · ${c.result}` : ""}
        </p>
        <h1 className="text-3xl font-black tracking-tight">{c.name}</h1>
        {c.summary && <p className="mt-1 text-sm text-muted">{c.summary}</p>}
      </header>

      <section aria-labelledby="info" className="mb-8">
        <h2 id="info" className="mb-3 text-2xl font-black tracking-tight">기본 정보</h2>
        <dl className="grid grid-cols-[5rem_1fr] gap-y-1.5 text-sm">
          {info.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="min-w-0 break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="timeline" className="mb-8">
        <h2 id="timeline" className="mb-3 text-2xl font-black tracking-tight">타임라인</h2>
        <Timeline events={c.events} color={color} />
      </section>

      <section aria-labelledby="tasks" className="mb-8">
        <h2 id="tasks" className="mb-3 text-2xl font-black tracking-tight">체크리스트</h2>
        {c.tasks.length === 0 ? (
          <p className="text-sm text-muted">등록된 할 일 없음</p>
        ) : (
          <>
            <ul className="mb-3 divide-y divide-line border-y border-line">
              {c.tasks.map((t, i) => (
                <li key={`${t.title}-${i}`} className={`flex gap-2 py-2 text-sm ${t.done ? "text-muted" : ""}`}>
                  <span aria-hidden>{t.done ? "✓" : "☐"}</span>
                  <span className="sr-only">{t.done ? "완료" : "미완료"}</span>
                  <span>{t.title}</span>
                </li>
              ))}
            </ul>
            {pct !== null && <ProgressBar value={pct} />}
          </>
        )}
      </section>

      {c.files && c.files.length > 0 && (
        <section aria-labelledby="files" className="mb-8">
          <h2 id="files" className="mb-3 text-2xl font-black tracking-tight">제출물</h2>
          <ul className="divide-y divide-line border-y border-line">
            {c.files.map((f) => (
              <li key={f.path} className="py-2 text-sm">
                <a href={f.path} target="_blank" rel="noopener noreferrer" className="underline">
                  {f.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.notes && (
        <section aria-labelledby="notes" className="mb-8">
          <h2 id="notes" className="mb-3 text-2xl font-black tracking-tight">메모</h2>
          <p className="whitespace-pre-wrap text-sm">{c.notes}</p>
        </section>
      )}

      {c.repo && (
        <section aria-labelledby="repo">
          <h2 id="repo" className="mb-3 text-2xl font-black tracking-tight">GitHub 활동</h2>
          <RepoActivity repo={c.repo} />
        </section>
      )}
    </main>
  );
}
