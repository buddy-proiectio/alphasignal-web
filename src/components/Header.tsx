import React from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { getLatestNotice } from "@/utils/get-latest-notice";
import TimeTicker from "@/components/TimeTicker";

export default async function Header() {
  const latestNotice = await getLatestNotice();

  return (
    <div className="w-full flex flex-col">
      {/* Notice Bar */}
      {latestNotice && (
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs py-2 px-6 border-b border-amber-500/20 text-center font-medium">
          <Link href={latestNotice.href} className="hover:underline">
            [공지] {latestNotice.title}
          </Link>
        </div>
      )}

      {/* Main Header Nav */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-300 mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight group"
          >
            <Image
              src="/logo.svg"
              alt="Alpha Signals Logo"
              width={24}
              height={24}
              className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12"
              priority
            />
            <span>ALPHA SIGNALS</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <TimeTicker />
            <Link
              href="/support"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
            >
              후원하기
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
    </div>
  );
}
