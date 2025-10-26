import React from "react";

export default function Logo({ size = 22 }: { size?: number }) {
  const s = size;
  const [imgOk, setImgOk] = React.useState(true);
  // Try to use provided logo image; fall back to vector mark
  if (imgOk) {
    return (
      <img
        src="/android-chrome-192x192.png"
        width={s}
        height={s}
        alt="LunaSpin logo"
        onError={() => setImgOk(false)}
        style={{ display: "inline-block", borderRadius: 6 }}
      />
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" aria-label="LunaSpin logo" role="img">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#0b0b12" />
      <circle cx="32" cy="32" r="24" fill="url(#lg)" opacity="0.25" />
      <circle cx="32" cy="32" r="16" fill="#f59e0b" opacity="0.35" />
    </svg>
  );
}
