import React from "react";
import Link from "next/link";

export interface ContentItem {
  type: "notice" | "signal";
  slug?: string;
  title: string;
  date: string;
  category?: string;
  lang?: string;
  href: string;
  contentLength?: number;
}

interface ContentCardProps {
  item: ContentItem;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const period = hours < 12 ? "오전" : "오후";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${year}.${month}.${day}. ${period} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

function formatReadingTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    return `${h}시간 이상 소요`;
  }
  return `${minutes}분 소요`;
}

export default function ContentCard({ item }: ContentCardProps) {
  const isNotice = item.category === "notice";
  const readingMinutes = item.contentLength
    ? Math.max(1, Math.round(item.contentLength / 300))
    : 1;

  return (
    <Link
      href={item.href}
      className="block p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 leading-relaxed mb-2">
        {item.title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {isNotice && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            공지
          </span>
        )}
        <span>{formatReadingTime(readingMinutes)}</span>
        <span>&middot;</span>
        <span>{formatDate(item.date)}</span>
      </div>
    </Link>
  );
}
