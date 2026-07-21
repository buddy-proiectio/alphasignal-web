"use client";

import React, { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Generate share URL (support client-only check for window)
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Alpha Signals - ${title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Native share cancelled or failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium cursor-pointer"
      title="링크 공유하기"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l5.577-3.253m-5.577 3.253l5.577 3.253m0 0a2.25 2.25 0 103.934 2.186 2.25 2.25 0 00-3.934-2.186zm0-10.912a2.25 2.25 0 103.934-2.186 2.25 2.25 0 00-3.934 2.186z"
        />
      </svg>
      <span>{copied ? "링크 복사됨!" : "공유"}</span>
    </button>
  );
}
