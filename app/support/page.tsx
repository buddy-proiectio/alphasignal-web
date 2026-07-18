import React from "react";
import Support from "@/components/Support";

export const metadata = {
  title: "후원하기 | Alpha Signals",
  description:
    "AlphaSignal의 양질의 투자 정보 분석을 후원하고 지원해주세요. 후원금은 데이터 서버 유지 및 분석 시스템 고도화에 전액 사용됩니다.",
};

export default function SupportPage() {
  return (
    <div className="max-w-[896px] mx-auto px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3">
          Alpha Signals 후원하기
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          우리는 지속가능하고 깨끗한 금융 정보 분석 제공을 추구합니다.
        </p>
      </header>

      <Support />
    </div>
  );
}
