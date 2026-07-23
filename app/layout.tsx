import React from "react";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import Script from "next/script";

export const metadata = {
  title: {
    default: "Alpha Signals - 미국 주식 리포트",
    template: "%s | Alpha Signals",
  },
  description:
    "우리는 지속가능하고 깨끗한 금융 정보 제공을 추구합니다. 자체 개발 AI 알고리즘이 추출한 미국 주식 매크로 지표, 실시간 주요 외신, SEC 공시 분석을 선제적으로 제공하는 100% 순수 데이터 리포트 매체입니다.",
  metadataBase: new URL("https://alphasignals.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Alpha Signals - 미국 주식 리포트",
    description:
      "우리는 지속가능하고 깨끗한 금융 정보 제공을 추구합니다. 광고와 소음이 배제된 미국 주식 1차 출처 데이터 리포트.",
    url: "https://alphasignals.vercel.app",
    siteName: "Alpha Signals",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/logo-light.png",
        width: 512,
        height: 512,
        alt: "Alpha Signals Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Alpha Signals - 미국 주식 리포트",
    description:
      "우리는 지속가능하고 깨끗한 금융 정보 제공을 추구합니다. 광고와 소음이 배제된 미국 주식 1차 출처 데이터 리포트.",
    images: ["/logo-light.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-pretendard antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Analytics />
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3003049022959567"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          <div className="min-h-screen bg-[--background] text-[--foreground] flex flex-col">
            <Header />
            <main className="grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
