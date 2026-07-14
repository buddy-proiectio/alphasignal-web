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
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="max-w-[768px] mx-auto px-6 py-8 space-y-4">
      {items.map((item, index) => (
        <ContentCard key={`${item.type}-${item.slug || index}`} item={item} />
      ))}
    </div>
  );
}
