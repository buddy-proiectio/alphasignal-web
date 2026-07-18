import Header from "@/components/Header";
import Adsense from "@/components/Adsense";
import { fetchSignalList, fetchSignalMarkdown } from "@/services/github";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { formatSignalDate } from "@/utils/format-date";
import { isUsMarketHoliday } from "@/utils/us-market-holidays";
import LocalDate from "@/components/LocalDate";

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

function formatDateString(ymd: string): string {
  if (ymd.length !== 8) return ymd;
  const year = ymd.slice(0, 4);
  const month = ymd.slice(4, 6);
  const day = ymd.slice(6, 8);
  return `${year}-${month}-${day}`;
}

const getKstDateString = () => {
  const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0]; // YYYY-MM-DD
};

function shouldShowFallbackWarning(
  activeTab: "alpha" | "premarket",
  hasTodayReport: boolean,
): boolean {
  if (hasTodayReport) return false;

  // Get current time in KST (UTC+9)
  const nowUtc = new Date().getTime();
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKst = new Date(nowUtc + kstOffset);

  const dayOfWeek = nowKst.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) return false;

  if (isUsMarketHoliday(nowKst)) return false;

  const currentHour = nowKst.getHours();
  const currentMinute = nowKst.getMinutes();
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
  let rawMarkdown = "";
  let mdxCompiled: any = null;
  let fetchError = "";

  try {
    const list = await fetchSignalList();
    // Filter signals by tab and language
    const targetCategory =
      activeTab === "premarket" ? "alpha_signal_premarket" : "alpha_signal";

    signals = list.filter(
      (s) => s.category === targetCategory && s.lang === activeLang,
    );

    if (signals.length > 0) {
      if (selectedDateParam) {
        const formattedTargetDate = formatDateString(selectedDateParam);
        currentSignal = signals.find((s) => s.date === formattedTargetDate);

        if (!currentSignal) {
          // Date specified but not found: rollback to latest
          currentSignal = signals[0];
          isRollback = true;
        }
      } else {
        // No date specified: take latest
        currentSignal = signals[0];

        // Only warn if today's report is missing AND it's past the publish threshold on a trading day
        const todayKst = getKstDateString();
        const hasTodayReport = currentSignal?.date === todayKst;
        if (shouldShowFallbackWarning(activeTab, hasTodayReport)) {
          isRollback = true;
        }
      }

      if (currentSignal) {
        const d = new Date(currentSignal.date);
        const dateYMD = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

        try {
          rawMarkdown = await fetchSignalMarkdown(
            activeLang,
            activeTab,
            dateYMD,
          );

          const { content } = await compileMDX<SignalFrontmatter>({
            source: rawMarkdown,
            options: { parseFrontmatter: true },
          });
          mdxCompiled = content;
        } catch (err) {
          console.error("Failed to fetch markdown file:", err);
          fetchError = "리포트 본문 데이터를 가져오지 못했습니다.";
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch signal list:", err);
    fetchError = "데이터베이스 연결 실패. 잠시 후 다시 시도해주세요.";
  }

  // Get recent 10 days archive
  const archiveList = signals.slice(0, 10);

  return (
    <>
      <Header />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
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
                <time className="text-xs text-slate-500 dark:text-slate-400">
                  <LocalDate dateStr={currentSignal.date} />
                </time>
              </div>
            )}

            {/* Main Article Content */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6 sm:p-8 min-h-[300px]">
              {fetchError ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 gap-2">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-sm font-medium">{fetchError}</p>
                </div>
              ) : mdxCompiled ? (
                <article className="prose dark:prose-invert max-w-none prose-sm sm:prose-base">
                  {mdxCompiled}
                </article>
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
            <div className="block lg:hidden flex flex-col gap-6 mt-4">
              <Adsense slot="mobile_bottom_banner" format="horizontal" />

              {/* Archive Section */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>📅</span> 지난 리포트 보러가기
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
                  {archiveList.map((item, idx) => {
                    const itemD = new Date(item.date);
                    const itemYMD = `${itemD.getFullYear()}${String(itemD.getMonth() + 1).padStart(2, "0")}${String(itemD.getDate()).padStart(2, "0")}`;
                    const isActive = currentSignal?.date === item.date;

                    return (
                      <Link
                        key={idx}
                        href={`/?tab=${activeTab}&lang=${activeLang}&date=${itemYMD}`}
                        className={`flex-none w-[200px] p-3 rounded-lg border snap-start transition-all ${
                          isActive
                            ? "bg-blue-500/10 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-300"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <time className="block text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                          {formatSignalDate(item.date)}
                        </time>
                        <h4 className="text-xs font-bold line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href={`/archive?tab=${activeTab}&lang=${activeLang}`}
                  className="mt-2 block text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  📅 지난 리포트 전체 보기 (아카이브)
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (LG screens only) */}
          <aside className="hidden lg:block sticky top-24 flex flex-col gap-6">
            {/* Archive Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>📅</span> 지난 리포트 아카이브
              </h3>
              <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {archiveList.map((item, idx) => {
                  const itemD = new Date(item.date);
                  const itemYMD = `${itemD.getFullYear()}${String(itemD.getMonth() + 1).padStart(2, "0")}${String(itemD.getDate()).padStart(2, "0")}`;
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
                        {formatSignalDate(item.date)}
                      </time>
                      <h4 className="text-xs line-clamp-1 leading-snug">
                        {item.title}
                      </h4>
                    </Link>
                  );
                })}
              </div>
              <Link
                href={`/archive?tab=${activeTab}&lang=${activeLang}`}
                className="mt-2 block text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
              >
                📅 지난 리포트 전체 보기 (아카이브)
              </Link>
            </div>

            {/* Google Adsense Vertical Slot */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4">
              <Adsense slot="sidebar_vertical_banner" format="vertical" />
            </div>

            {/* TradingView Discount Referral Card */}
            <div className="bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800 relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-blue-500/20 rounded-full blur-xl" />
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <span className="font-bold text-xs tracking-wider text-blue-400 uppercase font-mono">
                  TradingView partner
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold">트레이딩뷰 최대 할인 혜택</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  파트너 레퍼럴 링크로 가입하고 프리미엄 차트 기능 및 실시간
                  데이터 할인 혜택을 받아보세요.
                </p>
              </div>
              <a
                href="https://kr.tradingview.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
              >
                할인 혜택 받으러 가기
              </a>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
