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
}

interface ContentCardProps {
  item: ContentItem;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getCategoryBadge(category: string) {
  const badges: Record<string, { label: string; className: string }> = {
    notice: {
      label: "Notice",
      className:
        "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    },
    alpha_signal: {
      label: "Alpha",
      className:
        "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    },
    alpha_signal_premarket: {
      label: "Premarket",
      className:
        "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
    },
  };

  return (
    badges[category] || {
      label: category,
      className:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
    }
  );
}

export default function ContentCard({ item }: ContentCardProps) {
  const badge = item.category ? getCategoryBadge(item.category) : null;

  return (
    <Link
      href={item.href}
      className="block p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {formatDate(item.date)}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 leading-relaxed">
        {item.title}
      </h3>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          자세히 보기 &rarr;
        </span>
      </div>
    </Link>
  );
}
