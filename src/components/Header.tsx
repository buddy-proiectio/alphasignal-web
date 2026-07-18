import React from "react";
import Link from "next/link";
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
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight group"
          >
            <svg
              className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="256" cy="220" r="48" fill="#4f46e5" />
              <circle cx="256" cy="220" r="36" fill="#3b82f6" />
              <circle cx="256" cy="220" r="16" fill="#ffffff" />
              <rect x="70" y="196" width="100" height="48" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="6" />
              <line x1="120" y1="196" x2="120" y2="244" stroke="#3b82f6" stroke-width="4" />
              <rect x="170" y="214" width="38" height="12" fill="#64748b" />
              <rect x="342" y="196" width="100" height="48" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="6" />
              <line x1="392" y1="196" x2="392" y2="244" stroke="#3b82f6" stroke-width="4" />
              <rect x="304" y="214" width="38" height="12" fill="#64748b" />
              <path d="M220 286 C220 310 292 310 292 286 Z" fill="#64748b" />
              <line x1="256" y1="256" x2="256" y2="286" stroke="#64748b" stroke-width="8" />
              <path d="M220 340 A 50 50 0 0 0 292 340" stroke="#3b82f6" stroke-width="6" stroke-linecap="round" />
              <path d="M190 370 A 90 90 0 0 0 322 370" stroke="#4f46e5" stroke-width="6" stroke-linecap="round" opacity="0.8" />
              <path d="M160 400 A 130 130 0 0 0 352 400" stroke="#3b82f6" stroke-width="6" stroke-linecap="round" opacity="0.5" />
            </svg>
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
