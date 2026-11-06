/** 대회 인덱스(contests 배열 순서)별 색. 값은 globals.css의 --c-0 ~ --c-7 */
export function contestColor(index: number): string {
  return `var(--c-${index % 8})`;
}
