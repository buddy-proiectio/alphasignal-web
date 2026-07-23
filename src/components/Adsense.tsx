"use client";

import React, { useEffect } from "react";

interface AdsenseProps {
  client?: string;
  slot?: string;
  format?: string;
  responsive?: string;
  style?: React.CSSProperties;
}

export default function Adsense({
  client = "ca-pub-3003049022959567",
  slot = "5806319423",
  format = "auto",
  responsive = "true",
  style = { display: "block" },
}: AdsenseProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense push warning:", e);
    }
  }, []);

  return (
    <div className="w-full my-4 text-center overflow-hidden min-h-22.5 flex justify-center items-center">
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
