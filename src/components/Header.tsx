"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import TickerTapeWidget from "./TickerTapeWidget";

export default function Header() {
  return (
    <>
      <TickerTapeWidget />
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-[896px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold text-slate-900 dark:text-slate-50"
        >
          Alpha Signal
        </Link>
        <nav className="flex items-center gap-4">
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
    </>
  );
}
