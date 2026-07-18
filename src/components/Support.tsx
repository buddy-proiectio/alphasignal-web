"use client";

import React, { useState } from "react";

interface SupportProps {
  fairyLink?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export default function Support({
  fairyLink = "https://fairy.hada.io/@geeknews",
  bankName = "토스뱅크",
  accountNumber = "1000-1234-5678",
  accountHolder = "(주)버디프리미엄",
}: SupportProps) {
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
    <div className="max-w-[768px] mx-auto flex flex-col gap-10">
      {/* 1. Value Proposition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Why Support? */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold">
            🌱
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            왜 후원이 필요한가요?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            알파시그널은 투자자들이 불필요한 광고나 정보 왜곡 없이, 객관적인
            데이터와 AI 분석 모델이 추출한 핵심 시장 지표들을 투명하게 볼 수
            있도록 돕습니다. 서버 인프라 유지와 알고리즘 고도화를 위해 지속적인
            지원이 필요합니다.
          </p>
        </div>

        {/* Benefits? */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold">
            🎁
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            어떤 혜택이 있나요?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            후원에 대한 직접적인 물질적 대가나 유료 서비스(페이월) 장벽은
            없습니다. 대신 모든 정보가 무료로 열려있는 완전 개방 체제를
            지속하며, 광고 노출을 최소화하고 더 직관적이고 안정적인 시장 보고서
            개발로 보답합니다.
          </p>
        </div>
      </div>

      {/* 2. Support Action Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
        <div className="text-center max-w-md mx-auto flex flex-col gap-1.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            알파시그널 지원 방법
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            국내 창작자 후원 플랫폼인 Fairy를 통해 간편하게 응원하시거나, 계좌
            이체를 통해 마음을 보태주실 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mt-2">
          {/* Option A: Fairy platform */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col gap-1.5">
              <span className="inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                Fairy Platform
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                창작자 후원 채널
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                커피 한 잔 값을 구독하거나 일시 후원하여 주기적으로 서비스를
                지탱할 수 있습니다.
              </p>
            </div>
            <a
              href={fairyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-4 py-2.5 rounded-lg text-xs font-bold w-full transition-all hover:-translate-y-0.5 shadow-xs"
            >
              🧚 Fairy에서 응원하기
            </a>
          </div>

          {/* Option B: Account Transfer */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col gap-1.5">
              <span className="inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                Direct Transfer
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                직접 계좌 송금
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                중개 수수료 없이 직접 계좌를 통해 일시 금액을 송금하여 후원하실
                수 있습니다.
              </p>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-lg w-full text-xs">
              <div className="text-left flex flex-col gap-0.5">
                <span className="font-bold text-slate-900 dark:text-slate-50">
                  {bankName} {accountNumber}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  예금주: {accountHolder}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={`px-2.5 py-1.5 rounded-md font-semibold text-[10px] transition-colors border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-800"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                }`}
              >
                {copied ? "복사완료" : "복사"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
