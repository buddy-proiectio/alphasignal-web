"use client";

import React, { useEffect, useState } from "react";

function formatTime(timeZone: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "00:00";
  }
}

export default function TimeTicker() {
  const [mounted, setMounted] = useState(false);
  const [seoulTime, setSeoulTime] = useState("00:00");
  const [nyTime, setNyTime] = useState("00:00");

  useEffect(() => {
    setMounted(true);
    setSeoulTime(formatTime("Asia/Seoul"));
    setNyTime(formatTime("America/New_York"));

    const timer = setInterval(() => {
      setSeoulTime(formatTime("Asia/Seoul"));
      setNyTime(formatTime("America/New_York"));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-slate-400 dark:text-slate-500">
        <span>SEL --:--</span>
        <span>NYC --:--</span>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1">
        <span className="text-slate-400 dark:text-slate-500 font-semibold">SEL</span>
        <span className="text-slate-700 dark:text-slate-300 tabular-nums">{seoulTime}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-slate-400 dark:text-slate-500 font-semibold">NYC</span>
        <span className="text-slate-700 dark:text-slate-300 tabular-nums">{nyTime}</span>
      </div>
    </div>
  );
}
