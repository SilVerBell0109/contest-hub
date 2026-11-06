import { contests } from "@/lib/schema";
import { getRecentRepos } from "@/lib/github";
import KanbanBoard from "@/components/KanbanBoard";
import RecentRepos from "@/components/RecentRepos";
import UpcomingList from "@/components/UpcomingList";

export const revalidate = 3600;

export default async function Home() {
  const repos = await getRecentRepos("SilVerBell0109", 5);
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <section aria-labelledby="upcoming" className="mb-10">
        <h2 id="upcoming" className="mb-3 text-2xl font-black tracking-tight">
          다가오는 일정
        </h2>
        <UpcomingList contests={contests} limit={8} />
      </section>

      <section aria-labelledby="board" className="mb-10">
        <h2 id="board" className="mb-3 text-2xl font-black tracking-tight">
          프로젝트 보드
        </h2>
        <KanbanBoard contests={contests} />
      </section>

      <section aria-labelledby="github">
        <h2 id="github" className="mb-3 text-2xl font-black tracking-tight">
          최근 GitHub 활동
        </h2>
        <RecentRepos repos={repos} />
      </section>
    </main>
  );
}
