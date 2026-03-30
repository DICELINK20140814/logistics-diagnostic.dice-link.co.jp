"use client";

import { useState } from "react";

export function LogoWithFallback() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="text-sm font-medium tracking-wide text-[#0A2643]">
        ダイスリンク株式会社
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="ダイスリンク株式会社"
      className="h-10 w-auto"
      onError={() => setFailed(true)}
    />
  );
}
