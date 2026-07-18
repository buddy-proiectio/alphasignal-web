"use client";

import React, { useEffect, useState } from "react";
import { formatSignalDate } from "@/utils/format-date";

export default function LocalDate({ dateStr }: { dateStr: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Safe placeholder during hydration to prevent server/client layout mismatches
    return <span className="opacity-0">0000.00.00.</span>;
  }

  return <span>{formatSignalDate(dateStr)}</span>;
}
