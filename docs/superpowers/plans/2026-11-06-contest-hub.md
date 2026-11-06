# contest-hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공모전 일정·칸반·GitHub 활동을 보여주는 공개 개인 사이트를 만들고 Vercel에 배포한다.

**Architecture:** Next.js App Router 정적 페이지. 데이터는 `data/contests.ts` 한 파일을 zod로 검증해 쓰고, D-day는 클라이언트에서 계산한다. GitHub 정보만 서버 fetch + ISR(revalidate 3600).

**Tech Stack:** Next.js(최신 stable, App Router) · TypeScript · Tailwind CSS · zod · vitest · Vercel

**Spec:** `docs/superpowers/specs/2026-11-06-contest-site-design.md` (조사 기록 `docs/contest-hub/research.md`)

## Global Constraints
- UI 문구 한국어, 날짜·"오늘"은 Asia/Seoul 기준, 날짜 문자열 형식 `YYYY-MM-DD`.
- Stage 값과 열 순서: `"관심" | "준비중" | "제출완료" | "본선" | "종료"`. result: `"수상" | "탈락"`(종료에서만).
- GitHub 계정 `SilVerBell0109`, 저장소 `SilVerBell0109/contest-hub`(public).
- GitHub fetch는 `next: { revalidate: 3600 }`, `GITHUB_TOKEN` 있으면 `Authorization: Bearer`. 실패 시 `null` 반환, 예외 금지.
- 다크 모드는 시스템 설정(`prefers-color-scheme`)을 따른다.
- DB·로그인·크롤링·알림 금지(범위 밖).
- 빌드·테스트 로그는 `.logs/`에 저장하고 tail/grep으로 확인(`.logs/`는 gitignore).

## Review Focus
1. 한국 자정~오전 9시(UTC 전날) 접속 → "오늘"이 KST 날짜여야 한다. → Task 1 `todayKST` 테스트.
2. 연말→연초 일정(12/29 → 2027-01-11) D-day가 연도 경계를 넘어 정확해야 한다. → Task 1 `daysBetween` 테스트.
3. 기간 일정의 마지막 날(today == end) → "진행 중 · 종료 D-DAY"로 남아야 하고 다음 날 사라진다. → Task 1 `eventStatus` 테스트.
4. 일정이 없는 대회(헥토) → 카드에 "일정 없음", 다가오는 일정 목록·달력에서 조용히 빠진다. → Task 1 `upcomingEvents`, Task 2 데이터 테스트.
5. GitHub 403(한도)/404/네트워크 오류 → 해당 칸만 "GitHub 정보를 불러오지 못했습니다", 페이지는 렌더. → Task 3 테스트.

---

### Task 1: 프로젝트 골격 + 날짜 함수

**Files:**
- Create: Next.js 골격(`package.json`, `app/`, `tailwind`/`postcss` 설정, `tsconfig.json`, `.gitignore`), `vitest.config.ts`, `lib/types.ts`, `lib/date.ts`
- Test: `tests/date.test.ts`

**Interfaces:**
- Produces (`lib/types.ts`): `Stage`, `STAGES: readonly Stage[]`(위 순서), `ContestEvent = { title: string; date: string; end?: string; time?: string }`, `Task = { title: string; done: boolean }`, `Contest`(스펙의 데이터 모델, 이벤트 필드명은 `events: ContestEvent[]`).
- Produces (`lib/date.ts`):
  - `todayKST(now?: Date): string`
  - `daysBetween(from: string, to: string): number` (to − from, 일 단위, UTC 자정 기준 계산)
  - `type EventStatus = { kind: "upcoming"; days: number } | { kind: "ongoing"; daysToEnd: number } | { kind: "past" }`
  - `eventStatus(e: ContestEvent, today: string): EventStatus` (end 없으면 date 당일은 upcoming days 0)
  - `type UpcomingItem = { contest: Contest; event: ContestEvent; status: EventStatus }`
  - `upcomingEvents(contests: Contest[], today: string, limit?: number): UpcomingItem[]` — past 제외, 정렬 키는 ongoing이면 today, 아니면 date; 같으면 입력 순서 유지.
  - `nextEvent(contest: Contest, today: string): UpcomingItem | null`
  - `monthGrid(year: number, month: number): (string | null)[][]` — month 1~12, 일요일 시작, 주 단위 7칸, 빈칸 null.
  - `eventsOnDate(contests: Contest[], date: string): { contest: Contest; event: ContestEvent }[]` — date ≤ d ≤ (end ?? date).
  - `progress(tasks: Task[]): number | null` — 0~100 정수 반올림, 빈 배열 null.
  - `formatKoreanDate(date: string): string` → `"11월 12일 (목)"`.
  - `ddayLabel(s: EventStatus): string` → upcoming 0 `"D-DAY"`, n `"D-n"`; ongoing `"진행 중 · 종료 D-n"`(0이면 `"진행 중 · 오늘 종료"`); past `"종료"`.

- [ ] **Step 1:** 골격 생성. 폴더에 `docs/`·`.git`이 있어 create-next-app이 거부할 수 있으므로 스크래치 경로에 `npx create-next-app@latest contest-hub --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes` 후 `rsync -a --exclude .git`로 프로젝트 루트에 복사. `npm i zod` / `npm i -D vitest`. `package.json` scripts에 `"test": "vitest run"`. vitest 설정에 `@/` 별칭. `.gitignore`에 `.logs/` 추가.
- [ ] **Step 2: failing test** `tests/date.test.ts`:
  - `todayKST(new Date("2026-11-05T15:30:00Z")) === "2026-11-06"`, `todayKST(new Date("2026-11-06T14:59:00Z")) === "2026-11-06"`
  - `daysBetween("2026-12-29","2027-01-11") === 13`, `daysBetween("2026-11-06","2026-11-06") === 0`, `daysBetween("2026-11-07","2026-11-06") === -1`
  - `eventStatus({title:"x",date:"2026-11-12",end:"2026-11-19"}, "2026-11-19")` → `{kind:"ongoing", daysToEnd:0}`; 같은 이벤트 `"2026-11-20"` → `{kind:"past"}`; `"2026-11-06"` → `{kind:"upcoming", days:6}`
  - `upcomingEvents`: 일정 없는 대회 포함해도 에러 없고 해당 대회 항목 0개; 진행 중 항목이 미래 항목보다 앞; limit 적용
  - `monthGrid(2026, 11)[0][0] === "2026-11-01"`(일요일), 마지막 주에 `"2026-11-30"` 포함, 모든 행 길이 7
  - `progress([]) === null`, `progress([{done:true},{done:false},{done:false}]) === 33`
  - `ddayLabel({kind:"upcoming",days:0}) === "D-DAY"`, `formatKoreanDate("2026-11-12") === "11월 12일 (목)"`
- [ ] **Step 3:** `npm test > .logs/test.log 2>&1; tail -20 .logs/test.log` → FAIL(모듈 없음)
- [ ] **Step 4:** `lib/types.ts`, `lib/date.ts` 구현.
- [ ] **Step 5:** 테스트 PASS 확인.
- [ ] **Step 6:** commit `feat: Next.js 골격과 날짜 함수`

### Task 2: 스키마 + 실제 데이터

**Files:**
- Create: `lib/schema.ts`, `data/contests.ts`
- Test: `tests/schema.test.ts`, `tests/data.test.ts`

**Interfaces:**
- Consumes: `lib/types.ts`
- Produces: `parseContests(raw: unknown): Contest[]`(zod, 실패 시 throw), `contests: Contest[]`(`lib/schema.ts`가 `data/contests.ts`의 `rawContests`를 파싱해 export), `getContest(id: string): Contest | undefined`.

- [ ] **Step 1: failing test** `tests/schema.test.ts`: 정상 1건 통과; `date:"2026-13-01"` 거부; `"2026/11/12"` 거부; `end < date` 거부; id 중복 거부; stage `"준비중"` + result `"수상"` 거부; `repo:"no-slash"` 거부(형식 `owner/name`); `url`은 URL 형식.
  `tests/data.test.ts`: `contests.length === 4`; id 목록 `["kic-ai-agent","hana-finance-idea","elice-ai-challenge","hecto-ai-wallet"]`; `hecto-ai-wallet`의 events 길이 0; kic 마지막 일정 date `"2027-01-11"`.
- [ ] **Step 2:** 테스트 실행 → FAIL
- [ ] **Step 3:** `lib/schema.ts` 구현, `data/contests.ts` 작성. 값은 `docs/contest-hub/research.md`와 스펙 표 그대로:
  - kic-ai-agent: name "KIC AI 에이전트 공모전", host "한국투자공사(KIC) · 데이콘", url `https://daker.ai/public/hackathons/kic-ai-agent-competition`, category "AI 에이전트", stage 제출완료, prize "총 1,500만 원", events: 상호평가 2026-11-12~2026-11-19 / 본선 진출 발표 2026-12-03 / 본선 제출 마감 2026-12-22 / 온라인 발표 2026-12-29 / 최종 결과 발표 2027-01-11, tasks: [기획서 제출 ✓, 상호평가 참여, 본선 결과물 제출, 온라인 발표]
  - hana-finance-idea: name "제1회 하나증권 청년 금융아이디어 공모전", host "하나증권", url `https://linkareer.com/activity/360963`, category "금융 아이디어", stage 제출완료, prize "총 1,800만 원 (대상 500만 원)", notes "입상 시 하나증권 신입 채용 서류 면제", events: 본선 진출 10명 발표 2026-12-11 / 본선 PT·시상식 2026-12-23, tasks: [아이디어 제출 ✓, 본선 PT 준비]
  - elice-ai-challenge: name "과기부 × 엘리스 AI 챌린지", host "과학기술정보통신부 · 엘리스그룹", url `https://ai-challenge.elice.page/home/main`, category "AI 문제 해결", stage 준비중, summary "일상 속 문제를 AI로 해결 (전국민 AI 경진대회)", events: 접수 마감 2026-11-13 / 기획안·PoC 제출 2026-11-14~2026-11-22 time "23:59" / 결과 발표·시상 2026-12-11, tasks: [참가 신청서 작성, 기획안 작성, PoC 제출]
  - hecto-ai-wallet: name "HAI! 헥토 AI × Wallet 챌린지", host "헥토그룹", category "AI", stage 제출완료, events [], tasks: [결과물 제출 ✓], notes "공식 일정 미확인"
- [ ] **Step 4:** 테스트 PASS
- [ ] **Step 5:** commit `feat: 데이터 스키마와 참여 대회 4건`

### Task 3: GitHub 연동

**Files:**
- Create: `lib/github.ts`
- Test: `tests/github.test.ts` (`vi.stubGlobal("fetch", ...)`)

**Interfaces:**
- Produces:
  - `type Commit = { sha: string; message: string; date: string; url: string }` (message는 첫 줄만)
  - `type RepoActivity = { fullName: string; url: string; stars: number; openIssues: number; pushedAt: string; commits: Commit[] }`
  - `type RepoSummary = { name: string; fullName: string; url: string; description: string | null; pushedAt: string; language: string | null }`
  - `getRepoActivity(repo: string): Promise<RepoActivity | null>` — `/repos/{repo}` + `/repos/{repo}/commits?per_page=5`
  - `getRecentRepos(user: string, n?: number): Promise<RepoSummary[] | null>` — `/users/{user}/repos?sort=pushed&per_page={n}`, n 기본 5, fork 제외
- [ ] **Step 1: failing test:** 정상 응답 → 필드 매핑·commit message 첫 줄; 403 응답 → `null`; 404 → `null`; fetch reject → `null`; `process.env.GITHUB_TOKEN="t"`일 때 헤더 `Authorization: "Bearer t"` 포함, 없을 때 미포함; fork 제외 확인.
- [ ] **Step 2:** FAIL 확인 → **Step 3:** 구현(헤더 `Accept: application/vnd.github+json`, `next: { revalidate: 3600 }`) → **Step 4:** PASS → **Step 5:** commit `feat: GitHub 활동 조회`

### Task 4: 레이아웃 + 대시보드

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `components/Nav.tsx`, `components/DDayBadge.tsx`("use client"), `components/UpcomingList.tsx`("use client"), `components/KanbanBoard.tsx`, `components/ContestCard.tsx`, `components/ProgressBar.tsx`, `components/RecentRepos.tsx`

**Interfaces:**
- Consumes: `contests`, `STAGES`, `todayKST`, `eventStatus`, `upcomingEvents`, `nextEvent`, `ddayLabel`, `formatKoreanDate`, `progress`, `getRecentRepos`
- Produces: `<DDayBadge event={ContestEvent} />`(마운트 후 `todayKST()`로 계산, 마운트 전엔 날짜만 표시; D-3 이하 강조색), `<ProgressBar value={number} />`, `<ContestCard contest={Contest} />`, `useToday(): string | null` 훅(`components/useToday.ts`, 마운트 전 null).

- [ ] **Step 1:** 디자인 방향을 frontend-design 스킬로 잡고 `globals.css`에 색 토큰(라이트/다크)과 대회별 색 8개 정의. `layout.tsx`: `lang="ko"`, 메타데이터 title "contest-hub", Nav(대시보드 `/`, 달력 `/calendar`).
- [ ] **Step 2:** `app/page.tsx`: 다가오는 일정(limit 8, 클라이언트 계산) / 칸반 5열(데스크톱 가로 5열, 모바일 세로) / 최근 GitHub 활동(`getRecentRepos("SilVerBell0109", 5)`, null이면 실패 문구). 카드: 대회명, 주최, 다음 일정 D-day 또는 "일정 없음", 진행률 바(null이면 숨김), repo 있으면 표시, 링크 `/projects/{id}`. `export const revalidate = 3600`.
- [ ] **Step 3:** `npm run build > .logs/build.log 2>&1; tail -30 .logs/build.log` 성공, `npm run dev` 후 `/`를 브라우저(데스크톱·390px 폭)로 열어 4개 카드가 올바른 열에, 엘리스 "D-7"(2026-11-06 기준 접수 마감) 표시 확인.
- [ ] **Step 4:** commit `feat: 대시보드와 칸반 보드`

### Task 5: 달력 페이지

**Files:**
- Create: `app/calendar/page.tsx`, `components/Calendar.tsx`("use client")

**Interfaces:**
- Consumes: `monthGrid`, `eventsOnDate`, `useToday`, `formatKoreanDate`, 대회별 색(인덱스 = contests 배열 순서)
- [ ] **Step 1:** 이번 달(KST) 기본, 이전/다음 달 버튼, 오늘 칸 강조, 일정은 대회 색 칩(클릭 → 상세). `sm` 미만에서는 일정 있는 날짜만 목록으로.
- [ ] **Step 2:** 빌드 성공 + 브라우저 확인: 11월에 11/12~19 상호평가가 8칸에 표시, 12월로 이동 시 12/11에 하나증권·엘리스 두 칩, 2027년 1월 11일 표시.
- [ ] **Step 3:** commit `feat: 월 달력`

### Task 6: 대회 상세 페이지

**Files:**
- Create: `app/projects/[id]/page.tsx`, `app/not-found.tsx`, `components/Timeline.tsx`("use client", 지난 일정 흐리게), `components/RepoActivity.tsx`

**Interfaces:**
- Consumes: `getContest`, `contests`, `getRepoActivity`, `progress`, `ProgressBar`, `DDayBadge`
- [ ] **Step 1:** `generateStaticParams`(모든 id), `dynamicParams = false`, `generateMetadata`(대회명). 기본 정보(주최·분야·상금·팀·공식 링크 새 탭), 타임라인, 체크리스트+진행률, 메모, repo 있으면 RepoActivity(null이면 실패 문구), 없으면 섹션 숨김. `revalidate = 3600`.
- [ ] **Step 2:** 빌드 성공 + 브라우저: `/projects/kic-ai-agent` 일정 5개·진행률 25%, `/projects/hecto-ai-wallet` "등록된 일정 없음", `/projects/nope` 404.
- [ ] **Step 3:** commit `feat: 대회 상세 페이지`

### Task 7: GitHub 저장소 + Vercel 배포

- [ ] **Step 1:** `npm test`·`npm run lint`·`npm run build` 모두 통과(로그 `.logs/`).
- [ ] **Step 2:** `gh repo create SilVerBell0109/contest-hub --public --source . --push`
- [ ] **Step 3:** `vercel link --yes --project contest-hub` → `vercel git connect` → `vercel --prod`. 출력의 프로덕션 URL 기록.
- [ ] **Step 4:** 프로덕션 URL 세 페이지 브라우저 확인(데스크톱·모바일 폭), GitHub 활동 칸 표시 확인.
- [ ] **Step 5:** README에 "데이터 수정 방법(data/contests.ts → push)" 3줄, `docs/contest-hub/research.md` 진행 상황과 배포 URL 갱신, commit/push.
