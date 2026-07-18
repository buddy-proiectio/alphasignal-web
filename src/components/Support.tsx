"use client";

import React from "react";

interface SupportProps {
  fairyLink?: string;
}

export default function Support({
  fairyLink = "https://fairy.hada.io/@alphasignals#support",
}: SupportProps) {
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

      {/* 2. Single Action Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center gap-6 shadow-xs max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-2">
          <span className="inline-flex self-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
            Fairy Platform
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-1">
            공식 후원 채널 바로가기
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            창작자 후원 플랫폼 Fairy를 통해 따뜻한 응원을 전하실 수 있습니다.
            커피 한 잔 값을 구독하거나 일시 후원하여 주실 수 있습니다.
          </p>
        </div>

        <a
          href={fairyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-8 py-3 rounded-xl text-sm font-bold w-full max-w-xs transition-all hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
        >
          🧚 Fairy에서 후원하기
        </a>
      </div>
    </div>
  );
}
