"use client";

import React from "react";

export type Category = "all" | "alpha" | "premarket" | "notice";

interface FilterBarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "alpha", label: "Alpha Signals" },
  { value: "premarket", label: "Premarket" },
  { value: "notice", label: "Notice" },
];

export default function FilterBar({
  activeCategory,
  onCategoryChange,
}: FilterBarProps) {
  return (
    <div className="sticky top-14 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-[896px] mx-auto px-6 h-12 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
              activeCategory === cat.value
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
