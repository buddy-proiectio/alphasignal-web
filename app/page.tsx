import Adsense from "@/components/Adsense";
import Disclaimer from "@/components/Disclaimer";
import ShareButton from "@/components/ShareButton";
import { fetchSignalList, fetchSignalMarkdown } from "@/services/github";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { formatSignalDate } from "@/utils/format-date";
import { isUsMarketHoliday } from "@/utils/us-market-holidays";
import LocalDate from "@/components/LocalDate";
import { Suspense } from "react";

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-4">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    </div>
  );
}

interface ReportViewerContentProps {
  activeLang: "ko" | "en";
  activeTab: "alpha" | "premarket";
  dateYMD: string;
}

async function ReportViewerContent({
  activeLang,
  activeTab,
  dateYMD,
}: ReportViewerContentProps) {
  try {
    const rawMarkdown = await fetchSignalMarkdown(
      activeLang,
      activeTab,
      dateYMD,
    );

    const { content } = await compileMDX<SignalFrontmatter>({
      source: rawMarkdown,
      options: { parseFrontmatter: true },
    });

    return (
      <article className="prose dark:prose-invert max-w-none prose-sm sm:prose-base">
        {content}
      </article>
    );
  } catch (err) {
    console.error("Failed to fetch markdown file:", err);
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 gap-2">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm font-medium">
          리포트 본문 데이터를 가져오지 못했습니다.
        </p>
      </div>
    );
  }
}

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    lang?: string;
    date?: string;
  }>;
}

interface SignalFrontmatter {
  title?: string;
  date?: string;
}

const getKstDateString = () => {
  const kstParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = kstParts.find((p) => p.type === "year")?.value;
  const m = kstParts.find((p) => p.type === "month")?.value;
  const d = kstParts.find((p) => p.type === "day")?.value;

  return `${y}-${m}-${d}`;
};

function shouldShowFallbackWarning(
  activeTab: "alpha" | "premarket",
  hasTodayReport: boolean,
): boolean {
  if (hasTodayReport) return false;

  const now = new Date();

  const kstDayName = now.toLocaleDateString("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "long",
  });

  const isWeekend = kstDayName === "Saturday" || kstDayName === "Sunday";
  if (isWeekend) return false;

  if (isUsMarketHoliday(now)) return false;

  const kstTimeStr = now.toLocaleTimeString("en-US", {
    timeZone: "Asia/Seoul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const [currentHour, currentMinute] = kstTimeStr.split(":").map(Number);
  const currentTimeVal = currentHour * 60 + currentMinute;

  if (activeTab === "alpha") {
    const threshold = 20 * 60 + 30; // 20:30
    return currentTimeVal >= threshold;
  } else {
    const threshold = 23 * 60 + 10; // 23:10
    return currentTimeVal >= threshold;
  }
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab === "premarket" ? "premarket" : "alpha";
  const activeLang = resolvedParams.lang === "en" ? "en" : "ko";
  const selectedDateParam = resolvedParams.date as string | undefined;

  let signals: any[] = [];
  let currentSignal: any = null;
  let isRollback = false;
  let fetchError = "";

  try {
    const list = await fetchSignalList();
    const targetCategory =
      activeTab === "premarket" ? "alpha_signal_premarket" : "alpha_signal";

    signals = list.filter(
      (s) => s.category === targetCategory && s.lang === activeLang,
    );

    if (signals.length > 0) {
      if (selectedDateParam) {
        currentSignal = signals.find(
          (s) => s.date.slice(0, 10).replace(/-/g, "") === selectedDateParam,
        );

        if (!currentSignal) {
          currentSignal = signals[0];
          isRollback = true;
        }
      } else {
        currentSignal = signals[0];

        const todayKst = getKstDateString();
        const hasTodayReport = currentSignal?.date?.slice(0, 10) === todayKst;
        if (shouldShowFallbackWarning(activeTab, hasTodayReport)) {
          isRollback = true;
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch signal list:", err);
    fetchError = "데이터베이스 연결 실패. 잠시 후 다시 시도해주세요.";
  }

  let archiveList = signals.slice(0, 5);
  if (currentSignal && signals.length > 0) {
    const currentIndex = signals.findIndex(
      (s) => s.date === currentSignal.date,
    );
    if (currentIndex !== -1) {
      let start = currentIndex - 2;
      let end = currentIndex + 2;

      if (start < 0) {
        end += Math.abs(start);
        start = 0;
      }
      if (end >= signals.length) {
        start -= end - signals.length + 1;
        end = signals.length - 1;
      }
      start = Math.max(0, start);
      end = Math.min(signals.length - 1, end);

      archiveList = signals.slice(start, end + 1);
    }
  }
  const dateYMD = currentSignal
    ? currentSignal.date.slice(0, 10).replace(/-/g, "")
    : "";

  return (
    <div className="max-w-300 mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Left Column: Content Terminal */}
        <div className="flex flex-col gap-6">
          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            {/* Tabs: Alpha Signal / Premarket */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
              <Link
                href={`/?tab=alpha&lang=${activeLang}`}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === "alpha"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                Alpha Signal
              </Link>
              <Link
                href={`/?tab=premarket&lang=${activeLang}`}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === "premarket"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                Premarket
              </Link>
            </div>

            {/* Language Switch: KO / EN */}
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link
                href={`/?tab=${activeTab}&lang=ko`}
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
                href={`/?tab=${activeTab}&lang=en`}
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

          {/* Warning / Fallback Notice Banner */}
          {isRollback && currentSignal && (
            <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs py-3 px-4 rounded-lg border border-blue-200/50 dark:border-blue-900/50 flex items-center gap-2">
              <span>💡</span>
              <span>
                오늘 자 리포트가 아직 준비되지 않아, 가장 최신 리포트(
                {formatSignalDate(currentSignal.date)})를 표시합니다.
              </span>
            </div>
          )}

          {/* Document Header Info */}
          {currentSignal && (
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                {currentSignal.title}
              </h1>
              <div className="flex items-center justify-between gap-4">
                <time className="text-xs text-slate-500 dark:text-slate-400">
                  <LocalDate dateStr={currentSignal.date} />
                </time>
                <ShareButton title={currentSignal.title} />
              </div>
            </div>
          )}

          {/* Main Article Content */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6 sm:p-8 min-h-75">
            {fetchError ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 gap-2">
                <span className="text-3xl">⚠️</span>
                <p className="text-sm font-medium">{fetchError}</p>
              </div>
            ) : currentSignal ? (
              <>
                <Suspense fallback={<ReportSkeleton />}>
                  <ReportViewerContent
                    activeLang={activeLang}
                    activeTab={activeTab}
                    dateYMD={dateYMD}
                  />
                </Suspense>
                <Disclaimer />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 gap-2">
                <span className="text-3xl">📁</span>
                <p className="text-sm font-medium">
                  조회 가능한 리포트가 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* Mobile Bottom Layout (Ad & Archive) */}
          <div className="flex lg:hidden flex-col gap-6 mt-4">
            <Adsense slot="mobile_bottom_banner" format="horizontal" />

            {/* Archive Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>📅</span> 지난 리포트 보러가기
                </h3>
                <Link
                  href={`/archive?tab=${activeTab}&lang=${activeLang}`}
                  className="text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors text-xs font-semibold flex items-center gap-0.5"
                >
                  더보기 <span className="text-[10px]">→</span>
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
                {archiveList.map((item, idx) => {
                  const itemYMD = item.date.slice(0, 10).replace(/-/g, "");
                  const isActive = currentSignal?.date === item.date;

                  return (
                    <Link
                      key={idx}
                      href={`/?tab=${activeTab}&lang=${activeLang}&date=${itemYMD}`}
                      className={`flex-none w-50 p-3 rounded-lg border snap-start transition-all ${
                        isActive
                          ? "bg-blue-500/10 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <time className="block text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                        <LocalDate dateStr={item.date} />
                      </time>
                      <h4 className="text-xs font-bold line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.excerpt && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (LG screens only) */}
        <aside className="hidden lg:flex sticky top-8 flex-col gap-6">
          {/* Archive Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📅</span> 지난 리포트 아카이브
              </h3>
              <Link
                href={`/archive?tab=${activeTab}&lang=${activeLang}`}
                className="text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 transition-colors text-xs font-semibold flex items-center gap-0.5"
              >
                더보기 <span className="text-[10px]">→</span>
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {archiveList.map((item, idx) => {
                const itemYMD = item.date.slice(0, 10).replace(/-/g, "");
                const isActive = currentSignal?.date === item.date;

                return (
                  <Link
                    key={idx}
                    href={`/?tab=${activeTab}&lang=${activeLang}&date=${itemYMD}`}
                    className={`group block p-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <time className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                      <LocalDate dateStr={item.date} />
                    </time>
                    <h4 className="text-xs line-clamp-1 leading-snug font-medium">
                      {item.title}
                    </h4>
                    {item.excerpt && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-relaxed">
                        {item.excerpt}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Google Adsense Vertical Slot */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4">
            <Adsense slot="sidebar_vertical_banner" format="vertical" />
          </div>
        </aside>
      </div>
    </div>
  );
}
