"use client";

import React from "react";
import ContentCard, { ContentItem } from "./ContentCard";

interface ContentListProps {
  items: ContentItem[];
  emptyMessage?: string;
}

export default function ContentList({
  items,
  emptyMessage = "등록된 콘텐츠가 없습니다.",
}: ContentListProps) {
  const INITIAL_COUNT = 10;
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_COUNT);

  // Reset visible count when filtered items change
  React.useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  return (
    <div className="max-w-[896px] mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleItems.map((item, index) => (
          <ContentCard key={`${item.type}-${item.slug || index}`} item={item} />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="group flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span>더 보기</span>
            <svg
              className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors transform group-hover:translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
