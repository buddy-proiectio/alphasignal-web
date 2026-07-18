"use client";

import React, { useState } from "react";

interface SupportProps {
  fairyLink?: string;
  contactEmail?: string;
}

export default function Support({
  fairyLink = "https://fairy.hada.io/@alphasignals#support",
  contactEmail = "support@alphasignals.co",
}: SupportProps) {
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto flex flex-col gap-12 items-center text-center">
      {/* 1. Main Action Area: Support & Contact */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        {/* Fairy Support Link */}
        <a
          href={fairyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-8 py-3.5 rounded-xl text-base font-bold w-full sm:w-auto transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg cursor-pointer"
        >
          🧚 Fairy에서 후원하기
        </a>

        {/* Email Inquiry Button */}
        <button
          onClick={handleCopyEmail}
          className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-8 py-3.5 rounded-xl text-base font-bold w-full sm:w-auto transition-all hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          ✉️ {emailCopied ? "이메일 복사 완료!" : "공식 이메일 문의"}
        </button>
      </div>

      <p className="text-sm text-slate-400 dark:text-slate-500 -mt-8">
        Fairy를 통한 창작자 후원 또는 이메일을 통한 제휴 및 서비스 관련 문의가
        가능합니다.
      </p>

      {/* Divider */}
      <div className="w-full h-px bg-slate-200 dark:bg-slate-800/80" />

      {/* 2. Explanations below (🌱 Why & 🎁 Benefits) */}
      <div className="flex flex-col gap-8 text-left w-full">
        {/* Why Support? */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <span>🌱</span> 왜 후원이 필요한가요?
          </h3>
          <p className="text-sm sm:text-base text-slate-650 dark:text-slate-300 leading-relaxed">
            알파시그널은 투자자들이 불필요한 광고나 정보 왜곡 없이, 객관적인
            데이터와 AI 분석 모델이 추출한 핵심 시장 지표들을 투명하게 볼 수
            있도록 돕습니다. 서버 인프라 유지와 알고리즘 고도화를 위해 지속적인
            지원이 필요합니다.
          </p>
        </div>

        {/* Benefits? */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <span>🎁</span> 어떤 혜택이 있나요?
          </h3>
          <p className="text-sm sm:text-base text-slate-650 dark:text-slate-300 leading-relaxed">
            후원에 대한 직접적인 물질적 대가나 유료 서비스(페이월) 장벽은
            없습니다. 대신 모든 정보가 무료로 열려있는 완전 개방 체제를
            지속하며, 광고 노출을 최소화하고 더 직관적이고 안정적인 시장 보고서
            개발로 보답합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
