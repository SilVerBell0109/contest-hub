"use client";

import { useSyncExternalStore } from "react";
import { todayKST } from "@/lib/date";

const subscribe = () => () => {};

/** 마운트 전(서버 렌더 포함)엔 null, 이후 KST 오늘 날짜 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, () => todayKST(), () => null);
}
