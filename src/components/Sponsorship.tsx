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
    <div
      style={{
        margin: "3rem auto 1.5rem",
        padding: "2rem",
        borderRadius: "16px",
        background:
          "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card-hover)) 100%)",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-lg)",
        maxWidth: "600px",
        textAlign: "center",
      }}
    >
      <h3
        style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "1.25rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          color: "hsl(var(--foreground))",
        }}
      >
        ✨ Premium Support & Sponsorship
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: "hsl(var(--muted))",
          marginBottom: "1.5rem",
          lineHeight: "1.5",
        }}
      >
        Buddy Premium의 양질의 투자 정보 분석을 후원해주세요. 후원금은 데이터
        서버 유지 및 분석 시스템 고도화에 전액 사용됩니다.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Toss Pay Button */}
        <a
          href={tossLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            backgroundColor: "#0050ff",
            color: "#ffffff",
            padding: "0.75rem 2rem",
            borderRadius: "12px",
            fontSize: "0.95rem",
            fontWeight: 700,
            width: "100%",
            maxWidth: "320px",
            transition: "all var(--transition-fast)",
            boxShadow: "0 4px 12px rgba(0, 80, 255, 0.3)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#0040cc";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#0050ff";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>Toss Pay로 후원하기</span>
        </a>

        {/* Bank Account Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            padding: "0.75rem 1.25rem",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "320px",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <span style={{ color: "hsl(var(--muted))", marginRight: "0.5rem" }}>
              {bankName}
            </span>
            <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
              {accountNumber}
            </span>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>
              예금주: {accountHolder}
            </div>
          </div>
          <button
            onClick={handleCopy}
            style={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: copied ? "hsl(var(--success))" : "hsl(var(--foreground))",
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.75rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
