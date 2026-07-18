import React from "react";
import Link from "next/link";

export default function Disclaimer() {
  return (
    <div className="mt-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 sm:p-6 flex flex-col gap-3 text-xs text-slate-500 dark:text-slate-400">
      <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
        중요 안내사항
      </h4>
      <ol className="list-decimal pl-4 space-y-2 leading-relaxed text-slate-600 dark:text-slate-400">
        <li>
          본 리포트는 투자 판단을 돕기 위한 순수 데이터 제공을 목적으로 하며,
          특정 종목에 대한 매수·매도 등 투자 권유나 자문을 의미하지 않습니다.
        </li>
        <li>
          제공되는 모든 내용은 자체 개발한 AI 알고리즘이 분석 및 가공한
          결과물이며, 작성자의 주관적 의견이 배제되어 있습니다.
        </li>
        <li>
          자동화된 시스템을 통한 수집 과정에서 오류, 지연 또는 누락이 발생할 수
          있으므로 정보의 완전성을 보장하지 않습니다. 중요한 수치는 반드시 영문
          원문을 교차 검증하시기 바랍니다.
        </li>
        <li>
          본 리포트의 데이터를 활용한 모든 투자 판단과 결과에 대한 최종 책임은
          전적으로 본인에게 있습니다.
        </li>
        <li>
          서비스 운영에 관한 질문은{" "}
          <Link
            href="/support"
            className="underline hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
          >
            지원 및 문의 안내 채널
          </Link>
          을 통해 문의하여 주시기 바랍니다. 리포트의 해석 또는 투자 판단에
          영향을 미치는 문의에는 답변하지 않습니다.
        </li>
      </ol>
    </div>
  );
}
