import React from "react";
import Header from "@/components/Header";
import { fetchSignalList } from "@/services/github";
import { formatSignalDate } from "@/utils/format-date";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    lang?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

export default async function ArchivePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab === "premarket" ? "premarket" : "alpha";
  const activeLang = resolvedParams.lang === "en" ? "en" : "ko";
  const currentPageInput = Number(resolvedParams.page || 1);
  const currentPage = isNaN(currentPageInput) || currentPageInput < 1 ? 1 : currentPageInput;

  let signals: any[] = [];
  let fetchError = "";

  try {
    const list = await fetchSignalList();
    const targetCategory =
      activeTab === "premarket"
        ? "alpha_signal_premarket"
        : "alpha_signal";

    signals = list.filter(
      (s) => s.category === targetCategory && s.lang === activeLang,
    );
  } catch (err) {
    console.error("Failed to fetch signal list for archive:", err);
    fetchError = "데이터 목록을 가져오지 못했습니다.";
  }

  const totalItems = signals.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSignals = signals.slice(startIndex, endIndex);

  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-6 py-10">
        <div className="flex flex-col gap-6">
          
          {/* Page Header */}
          <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              📁 전체 리포트 아카이브
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alpha Signal 및 Premarket 리포트 목록을 페이지별로 열람할 수 있습니다.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
            {/* Tab Switches */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
              <Link
                href={`/archive?tab=alpha&lang=${activeLang}&page=1`}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === "alpha"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                Alpha Signal
              </Link>
              <Link
                href={`/archive?tab=premarket&lang=${activeLang}&page=1`}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === "premarket"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                Premarket
              </Link>
            </div>

            {/* Language Switch */}
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link
                href={`/archive?tab=${activeTab}&lang=ko&page=1`}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeLang === "ko"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-bold"
                    : "hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                KO
              </Link>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Link
                href={`/archive?tab=${activeTab}&lang=en&page=1`}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeLang === "en"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-bold"
                    : "hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                EN
              </Link>
            </div>
          </div>

          {/* List Content */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden">
            {fetchError ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 gap-2">
                <span className="text-3xl">⚠️</span>
                <p className="text-sm font-medium">{fetchError}</p>
              </div>
            ) : paginatedSignals.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedSignals.map((item, index) => {
                  const dateYMD = item.date.replace(/-/g, "");

                  return (
                    <Link
                      key={index}
                      href={`/?tab=${activeTab}&lang=${activeLang}&date=${dateYMD}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 gap-2 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400">
                        {item.title}
                      </span>
                      <time className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatSignalDate(item.date)}
                      </time>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 gap-2">
                <span className="text-3xl">📁</span>
                <p className="text-sm font-medium">아카이브된 리포트가 없습니다.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-2">
              {/* Prev Button */}
              {safeCurrentPage > 1 ? (
                <Link
                  href={`/archive?tab=${activeTab}&lang=${activeLang}&page=${safeCurrentPage - 1}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  이전
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed">
                  이전
                </span>
              )}

              {/* Page indicator */}
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {safeCurrentPage} / {totalPages}
              </span>

              {/* Next Button */}
              {safeCurrentPage < totalPages ? (
                <Link
                  href={`/archive?tab=${activeTab}&lang=${activeLang}&page=${safeCurrentPage + 1}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  다음
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed">
                  다음
                </span>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
