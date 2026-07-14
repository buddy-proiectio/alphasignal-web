"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function TickerTapeWidget() {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        {
          proName: "FOREXCOM:DJI",
          title: "Dow Jones",
        },
        {
          proName: "FOREXCOM:NSXUSD",
          title: "Nasdaq",
        },
        {
          proName: "FOREXCOM:SPXUSD",
          title: "S&P 500",
        },
        {
          proName: "BINANCE:BTCUSDT",
          title: "Bitcoin",
        },
        {
          proName: "CMCMARKETS:GOLD",
          title: "Gold",
        },
        {
          proName: "FX:USDKRW",
          title: "USD/KRW",
        },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "regular",
      colorTheme: theme === "dark" ? "dark" : "light",
      locale: "ko",
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [mounted, theme]);

  if (!mounted) {
    return (
      <div className="h-[46px] bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
    );
  }

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full h-[46px] bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}
