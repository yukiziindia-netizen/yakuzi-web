"use client";

import React from "react";

export default function ComingSoon() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#050212] flex items-center justify-center overflow-hidden select-none z-[9999]">
      {/* Desktop View (md and above) */}
      <div className="hidden md:flex w-full h-full items-center justify-center relative p-0 m-0">
        <img
          src="/Desktop - Coming soon.webp"
          alt="Yukizi - Coming Soon"
          className="w-full h-full object-contain max-w-full max-h-full block"
        />
      </div>

      {/* Mobile View (sm and below) */}
      <div className="flex md:hidden w-full h-full items-center justify-center relative p-0 m-0">
        <img
          src="/Mobile - Coming soon.webp"
          alt="Yukizi - Coming Soon"
          className="w-full h-full object-contain max-w-full max-h-full block"
        />
      </div>
    </div>
  );
}
