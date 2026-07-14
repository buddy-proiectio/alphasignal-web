import React from "react";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata = {
  title: "Alpha Signal",
  description: "AI-powered market alpha signals and analysis",
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
          <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
