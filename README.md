# contest-hub

참여 중인 공모전의 일정과 진행상황을 한눈에 보는 개인 사이트.

- `/` 대시보드: 다가오는 일정(D-day), 단계별 칸반 보드, 최근 GitHub 활동
- `/calendar` 월 달력 (모바일에서는 날짜별 목록)
- `/projects/[id]` 대회 상세: 일정 타임라인, 할 일 체크리스트, 연결 저장소의 최근 커밋

Next.js(App Router) · TypeScript · Tailwind CSS · zod · vitest, Vercel 배포.

## 데이터 수정

대회 정보는 `data/contests.ts` 한 파일에만 있다. 고친 뒤 main에 push하면 Vercel이 자동 배포한다.

```ts
{
  id: "my-contest",          // URL용 slug (영문 소문자·숫자·하이픈 권장), 중복 불가
  name: "대회 이름",
  host: "주최",
  url: "https://...",        // 선택: 공식 공고
  category: "AI",
  stage: "준비중",           // 관심 | 준비중 | 제출완료 | 본선 | 종료
  result: "수상",            // 선택: stage가 "종료"일 때만 (수상 | 탈락)
  summary: "내가 하는 일",    // 선택
  prize: "총 1,000만 원",     // 선택
  team: "팀 이름",            // 선택
  events: [
    { title: "접수 마감", date: "2026-11-13" },
    { title: "기획안 제출", date: "2026-11-14", end: "2026-11-22", time: "23:59" },
  ],
  tasks: [{ title: "기획서 작성", done: false }],
  repo: "SilVerBell0109/저장소", // 선택: 상세 페이지에 최근 커밋 표시
  files: [                   // 선택: 제출물. 파일은 public/files/<id>/ 에 영문 이름으로 둔다
    { title: "기획서 (PDF)", path: "/files/<id>/proposal.pdf" },
  ],
  notes: "메모",              // 선택
}
```

- 날짜는 한국 시간 기준 `YYYY-MM-DD`. 기간 일정은 `end`를 함께 쓴다.
- 오타 키, 없는 날짜, `end < date`, 중복 id 등은 `npm test`와 빌드에서 바로 실패한다.
- 대회 색은 배열 순서로 정해진다. 중간에 끼워 넣으면 뒤 대회들의 색이 바뀐다.

```bash
npm test        # 데이터·날짜·GitHub 함수 검사
npm run build   # 배포 전 빌드 확인
npm run dev     # http://localhost:3000
```

## GitHub 연동

GitHub 정보는 서버에서 1시간 캐시(ISR)로 가져온다. 실패하면 "GitHub 정보를 불러오지 못했습니다"만 표시되고 페이지는 정상 렌더된다.
호출 한도를 늘리려면 Vercel 프로젝트 환경변수에 `GITHUB_TOKEN`(공개 저장소 읽기 권한이면 충분)을 넣는다.
