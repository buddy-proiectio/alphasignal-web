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
  client = "ca-pub-XXXXXXXXXXXXXXXX",
  slot = "1234567890",
  format = "auto",
  responsive = "true",
  style = { display: "block", textAlign: "center" },
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
    <div
      style={{
        margin: "1.5rem 0",
        padding: "1rem",
        border: "1px dashed hsl(var(--border))",
        borderRadius: "12px",
        backgroundColor: "hsl(var(--card) / 0.5)",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "4px",
          right: "12px",
          fontSize: "10px",
          color: "hsl(var(--muted))",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        ADVERTISEMENT
      </div>
      {/* Real ins tag */}
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
      {/* Fallback styling placeholder for visual layout */}
      <div
        style={{
          color: "hsl(var(--muted))",
          fontSize: "12px",
          padding: "1rem 0",
        }}
      >
        Google AdSense Placeholder (Slot: {slot})
      </div>
    </div>
  );
}
