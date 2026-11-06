# contest-hub 설계

작성 2026-11-06. 조사 기록은 `docs/contest-hub/research.md`.

## 목적
참여 중인 공모전의 일정과 내 진행상황을 한눈에 보는 개인 사이트. 공개 URL로 포트폴리오 겸용.
성공 기준:
- 다가오는 마감이 D-day로 바로 보인다.
- 공모전별 단계(칸반)와 할 일 진행률이 보인다.
- 연결한 GitHub 저장소의 최근 활동이 재배포 없이 갱신된다.
- 사용자가 채팅으로 바뀐 내용을 알려주면 Claude가 데이터 파일 한 곳만 고쳐서 push하면 끝난다.

## 범위 밖 (YAGNI)
로그인·관리자 화면·DB, 공모전 자동 수집(크롤링), 알림(메일·푸시), 다국어, 댓글.

## 스택
- Next.js(App Router) + TypeScript + Tailwind CSS
- zod로 데이터 형식 검사, vitest로 단위 테스트
- 배포: GitHub 공개 저장소 `SilVerBell0109/contest-hub` ↔ Vercel Git 연동(main push = 프로덕션 배포)

## 데이터 모델 — `data/contests.ts`
공모전 하나 = 프로젝트 하나 = 칸반 카드 하나.

```ts
type Contest = {
  id: string;            // URL용 slug, 예: "kic-ai-agent"
  name: string;
  host: string;          // 주최
  url?: string;          // 공식 공고
  category: string;      // 예: "AI", "금융 아이디어"
  stage: Stage;          // 칸반 열
  result?: "수상" | "탈락"; // stage가 "종료"일 때만
  summary?: string;      // 내가 하는 일 한두 줄
  prize?: string;        // 예: "총 1,800만 원"
  team?: string;
  events: Event[];       // 일정
  tasks: Task[];         // 할 일 체크리스트
  repo?: string;         // "owner/name"
  notes?: string;
};
type Stage = "관심" | "준비중" | "제출완료" | "본선" | "종료";
type Event = { title: string; date: string; end?: string; time?: string }; // date/end는 "YYYY-MM-DD"(KST)
type Task  = { title: string; done: boolean };
```

- zod 스키마가 날짜 형식, `end >= date`, id 중복, `result`는 종료 단계에서만 허용 등을 검사한다. 위반 시 테스트와 빌드가 실패한다.
- 진행률 = 완료 task 수 / 전체 task 수. task가 없으면 진행률 바를 숨긴다.

### 시작 데이터 (사용자 제공 + 조사, 2026-11-06 기준)
| id | 대회 | stage | 일정 |
|---|---|---|---|
| kic-ai-agent | KIC AI 에이전트 공모전 (한국투자공사·데이콘) | 제출완료 | 11/12~11/19 상호평가, 12/3 본선 진출 발표, 12/22 본선 제출 마감, 12/29 온라인 발표, 2027-01-11 최종 결과 |
| hana-finance-idea | 제1회 하나증권 청년 금융아이디어 공모전 | 제출완료 | 12/11 본선 진출 10명 발표, 12/23 본선 PT·시상식 |
| elice-ai-challenge | 과기부 × 엘리스 AI 챌린지 | 준비중 | 11/13 접수 마감, 11/14~11/22 23:59 기획안·PoC 제출, 12/11 결과 발표 |
| hecto-ai-wallet | HAI! 헥토 AI × Wallet 챌린지 | 제출완료 | 없음 |

가짜 예시 데이터는 넣지 않는다(공개 사이트라 오해 소지). 확인 못 한 정보(헥토 링크·날짜)는 비워 둔다.

## 페이지
1. `/` 대시보드
   - **다가오는 일정**: 오늘 이후 일정을 날짜순으로 최대 8개, D-day 배지(D-3 이하 강조, 당일 "D-DAY"). 진행 중인 기간 일정(오늘이 date~end 사이)은 "진행 중 · 종료 D-n".
   - **칸반 보드**: 관심 / 준비중 / 제출완료 / 본선 / 종료 5열. 카드에 대회명, 주최, 다음 일정 D-day, 진행률 바, 저장소 표시. 카드 클릭 → 상세. 모바일에서는 열이 세로로 쌓인다.
   - **최근 GitHub 활동**: 계정 `SilVerBell0109`의 공개 저장소 중 최근 push 순 5개(이름, 설명, 마지막 push 시각).
2. `/calendar` 월 달력
   - 월 이동 버튼, 기본은 이번 달. 일정을 날짜 칸에 대회별 색으로 표시, 기간 일정은 해당 날짜마다 표시. 모바일에서는 날짜별 목록으로 바뀐다.
3. `/projects/[id]` 상세
   - 기본 정보(주최, 분야, 상금, 팀, 공식 링크), 일정 타임라인(지난 일정은 흐리게), 할 일 체크리스트 + 진행률, 메모.
   - repo가 있으면 GitHub 카드: 최근 커밋 5개(메시지, 날짜, 링크), 마지막 push, 열린 이슈 수, 별 수.
   - `generateStaticParams`로 정적 생성, 없는 id는 404.

공통: 상단 내비(대시보드 / 달력), 다크 모드(시스템 설정 따름), 한국어, 시각은 Asia/Seoul.

## 날짜 처리
- "오늘"은 KST 기준 날짜 문자열로 계산하는 순수 함수(`lib/date.ts`)로 둔다: `daysUntil(date, today)`, `eventStatus(event, today)`, `upcomingEvents(contests, today, limit)`.
- 정적 페이지가 배포일에 굳지 않도록 D-day를 표시하는 컴포넌트는 클라이언트에서 오늘 날짜를 구해 계산한다. 서버 렌더 값과 다를 수 있어 hydration 경고가 없도록 마운트 후 계산한다.

## GitHub 연동 — `lib/github.ts`
- 서버에서 GitHub REST API 호출, `fetch(..., { next: { revalidate: 3600 } })`로 1시간 캐시(ISR).
- `GITHUB_TOKEN` 환경변수가 있으면 Authorization 헤더 추가(호출 한도 상승). 없어도 동작.
- 함수: `getRepoActivity(repo)` → 커밋 5개·이슈 수·별·pushed_at, `getRecentRepos(user, n)`.
- 실패(네트워크, 404, 호출 한도) 시 예외를 던지지 않고 `null`을 돌려주고, 화면은 "GitHub 정보를 불러오지 못했습니다"만 표시한다. 페이지 전체는 항상 렌더된다.

## 폴더 구조
```
app/                layout.tsx, page.tsx, calendar/page.tsx, projects/[id]/page.tsx, not-found.tsx
components/         KanbanBoard, ContestCard, UpcomingList, DDayBadge(client), Calendar(client), ProgressBar, RepoActivity, RecentRepos, Nav
data/contests.ts    데이터 (유일하게 자주 고치는 파일)
lib/schema.ts       zod 스키마 + 검증된 contests export
lib/date.ts         날짜 순수 함수
lib/github.ts       GitHub API
tests/              date.test.ts, schema.test.ts, data.test.ts
```

## 테스트
- vitest: 날짜 함수(D-day, 기간 진행 중, 정렬, 연말·연초 경계), 스키마(잘못된 날짜·end<date·id 중복 거부), 실제 `data/contests.ts`가 스키마를 통과하는지.
- `next build` 성공.
- 미리보기 배포 후 세 페이지를 브라우저로 열어 표시 확인(모바일 폭 포함).

## 배포·운영
1. 로컬 빌드 확인 → `gh repo create SilVerBell0109/contest-hub --public` → push.
2. Vercel 프로젝트 생성 및 Git 연결(`vercel link` + `vercel git connect`), 프로덕션 배포.
3. 이후 업데이트: 사용자가 채팅으로 변경 사항 전달 → Claude가 `data/contests.ts` 수정 → `npm test` → commit/push → 자동 배포.
