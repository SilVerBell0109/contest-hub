import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "contest-hub",
  description: "공모전 일정, 프로젝트 진행 상황, GitHub 활동을 한곳에서 보는 개인 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
