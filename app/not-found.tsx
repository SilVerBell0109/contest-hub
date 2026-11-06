import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 sm:px-6">
      <h1 className="mb-3 text-3xl font-black tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mb-6 text-sm text-muted">주소가 잘못되었거나 존재하지 않는 대회입니다.</p>
      <Link href="/" className="text-sm font-bold underline">
        대시보드로 돌아가기
      </Link>
    </main>
  );
}
