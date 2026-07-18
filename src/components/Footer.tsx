import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 py-8 px-6 mt-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-4 text-xs text-slate-500 dark:text-slate-400">
        
        {/* Footer Bottom info */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">ALPHA SIGNAL</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">홈으로</Link>
            <Link href="/archive" className="hover:underline">아카이브</Link>
            <Link href="/sponsorship" className="hover:underline">후원하기</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
