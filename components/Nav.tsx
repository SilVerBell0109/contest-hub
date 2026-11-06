import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-line">
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex max-w-7xl items-baseline gap-6 px-4 py-4 sm:px-6"
      >
        <Link href="/" className="text-lg font-black tracking-tight">
          contest-hub
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-ink">
          대시보드
        </Link>
        <Link href="/calendar" className="text-sm text-muted hover:text-ink">
          달력
        </Link>
      </nav>
    </header>
  );
}
