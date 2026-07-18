import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { getLatestNotice } from "@/utils/get-latest-notice";
import TimeTicker from "@/components/TimeTicker";

// TODO: real-time market data, not hard coding
const marketData = [
  { name: "S&P 500", value: "5,633.91", change: "-0.12%", isUp: false },
  { name: "나스닥", value: "17,910.30", change: "+0.25%", isUp: true },
  { name: "다우존스", value: "40,211.72", change: "-0.05%", isUp: false },
  { name: "미 국채 10년", value: "4.180%", change: "+0.020", isUp: true },
  { name: "VIX 지수", value: "13.12", change: "-1.45%", isUp: false },
];

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

      {/* Static Market Chips */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 text-xs py-2 px-6 overflow-x-auto scrollbar-hide">
        <div className="max-w-[1200px] mx-auto flex items-center gap-4 whitespace-nowrap">
          {marketData.map((data, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
            >
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {data.name}
              </span>
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {data.value}
              </span>
              <span
                className={`font-mono text-[10px] ${
                  data.isUp
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {data.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Header Nav */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight"
          >
            ALPHA SIGNAL
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <TimeTicker />
            <Link
              href="/sponsorship"
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
