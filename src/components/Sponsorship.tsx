"use client";

import React, { useState } from "react";

interface SponsorshipProps {
  tossLink?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export default function Sponsorship({
  tossLink = "https://toss.me/buddypremium",
  bankName = "토스뱅크",
  accountNumber = "1000-1234-5678",
  accountHolder = "(주)버디프리미엄",
}: SponsorshipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy account number:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg text-center">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
        Premium Support &amp; Sponsorship
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        Buddy Premium의 양질의 투자 정보 분석을 후원해주세요. 후원금은 데이터
        서버 유지 및 분석 시스템 고도화에 전액 사용됩니다.
      </p>

      <div className="flex flex-col gap-4 items-center justify-center">
        <a
          href={tossLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#0050ff] hover:bg-[#0040cc] text-white px-8 py-3 rounded-xl text-sm font-bold w-full max-w-xs transition-all duration-150 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(0,80,255,0.3)]"
        >
          Toss Pay로 후원하기
        </a>

        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl w-full max-w-xs text-sm">
          <div className="text-left">
            <span className="text-slate-500 dark:text-slate-400 mr-2">
              {bankName}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              {accountNumber}
            </span>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              예금주: {accountHolder}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors duration-150 ${
              copied
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
