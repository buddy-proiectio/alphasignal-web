import React from "react";
import Link from "next/link";

export const metadata = {
  title: "404 - 페이지를 찾을 수 없습니다 | Alpha Signals",
  description: "요청하신 페이지를 찾을 수 없습니다. 주소를 확인해주세요.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center py-12">
      {/* 404 Text Hero */}
      <h1 className="text-7xl sm:text-8xl font-black text-slate-200 dark:text-slate-800 tracking-wider mb-2 select-none">
        404
      </h1>

      {/* 404 Error Code chip */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 mb-6">
        PAGE NOT FOUND
      </span>

      {/* Error message headings */}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3 tracking-tight">
        길을 잃으셨나요?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8">
        요청하신 페이지가 존재하지 않거나 이전되었을 수 있습니다.
        <br />
        입력하신 웹 주소를 다시 확인해주세요.
      </p>

      {/* CTA Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/"
          className="inline-flex justify-center items-center bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-xs hover:shadow-sm transition-all"
        >
          🏠 홈으로 돌아가기
        </Link>
        <Link
          href="/archive"
          className="inline-flex justify-center items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-all"
        >
          📂 아카이브 보기
        </Link>
      </div>
    </div>
  );
}
