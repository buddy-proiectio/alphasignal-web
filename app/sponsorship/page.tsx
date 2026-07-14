import React from "react";
import Header from "../../src/components/Header";
import Sponsorship from "../../src/components/Sponsorship";

export const metadata = {
  title: "후원하기 | AlphaSignal",
  description:
    "AlphaSignal의 양질의 투자 정보 분석을 후원해주세요. 후원금은 데이터 서버 유지 및 분석 시스템 고도화에 전액 사용됩니다.",
};

export default function SponsorshipPage() {
  return (
    <>
      <Header />
      <main className="max-w-[768px] mx-auto px-6 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            후원하기
          </h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            AlphaSignal의 양질의 투자 정보 분석을 후원해주세요.
            <br />
            후원금은 데이터 서버 유지 및 분석 시스템 고도화에 전액 사용됩니다.
          </p>
        </header>

        <Sponsorship />
      </main>
    </>
  );
}
