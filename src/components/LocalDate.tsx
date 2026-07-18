"use client";

import React, { useEffect, useState } from "react";
import { formatSignalDate } from "@/utils/format-date";

export default function LocalDate({ dateStr }: { dateStr: string }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(formatSignalDate(dateStr));
  }, [dateStr]);

  if (!formatted) {
    // Hydration-safe initial render (date-only)
    const dateOnly = dateStr.split("T")[0];
    const parts = dateOnly.split("-");
    if (parts.length === 3) {
      return <span className="tabular-nums">{`${parts[0]}.${parts[1]}.${parts[2]}.`}</span>;
    }
    return <span className="tabular-nums">{dateStr}</span>;
  }

  return <span className="tabular-nums">{formatted}</span>;
}
