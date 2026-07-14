import React from "react";
import Link from "next/link";
import { calcReadingTime, formatReadingTime } from "../utils/reading-time";

export interface ContentItem {
  type: "notice" | "signal";
  slug?: string;
  title: string;
  date: string;
  category?: string;
  lang?: string;
  href: string;
  readingMinutes?: number;
  excerpt?: string;
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
    return `${year}.${month}.${day}`;
  } catch {
    return dateStr;
  }
}

export default function ContentCard({ item }: ContentCardProps) {
  const isNotice = item.category === "notice";
  const readingMinutes = item.readingMinutes ?? 1;

  const itemDate = new Date(item.date);
  const today = new Date();
  const isNew =
    !isNaN(itemDate.getTime()) &&
    itemDate.getFullYear() === today.getFullYear() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getDate() === today.getDate();

  return (
    <Link
      href={item.href}
      className="flex flex-col h-full p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
    >
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 leading-relaxed mb-2">
          {isNew && (
            <span className="inline-flex items-center justify-center w-4 h-4 mr-1.5 rounded-full bg-blue-600 text-white text-[0.5rem] font-bold align-middle">
              N
            </span>
          )}
          <span>{item.title}</span>
        </h3>

        {item.excerpt && (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">
            {item.excerpt}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-auto">
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
