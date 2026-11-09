export const STAGES = ["관심", "준비중", "제출완료", "본선", "종료"] as const;
export type Stage = (typeof STAGES)[number];

export type ContestEvent = {
  title: string;
  date: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
  time?: string;
};

export type Task = { title: string; done: boolean };

export type ContestFile = {
  title: string;
  path: string; // /files/<대회 id>/<파일명>, 실제 파일은 public/ 아래
};

export type Contest = {
  id: string;
  name: string;
  host: string;
  url?: string;
  category: string;
  stage: Stage;
  result?: "수상" | "탈락"; // 종료 단계에서만
  summary?: string;
  prize?: string;
  team?: string;
  events: ContestEvent[];
  tasks: Task[];
  repo?: string;
  files?: ContestFile[];
  notes?: string;
};
