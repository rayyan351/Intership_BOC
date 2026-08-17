// src/components/ui/BannerCTAButton.jsx
"use client";

import React from "react";
import { Icon } from "@/components/ui/Icons";

export function BannerCTAButton({
  children,
  onClick,
  className = "",
  size = "md",
}) {
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-xs sm:text-sm",
    lg: "px-7 py-3 text-sm sm:text-base",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/cta inline-flex items-center gap-2 rounded-xl bg-[#F4C61A] text-neutral-950 font-black tracking-wide uppercase transition-all duration-200 hover:bg-[#E0B210] hover:shadow-[0_4px_18px_rgba(244,198,26,0.4)] active:scale-95 cursor-pointer shadow-md ${sizeStyles[size]} ${className}`}
    >
      <span>{children}</span>
      <Icon
        name="chevronRight"
        size={14}
        strokeWidth={3}
        className="transition-transform duration-200 group-hover/cta:translate-x-1"
      />
    </button>
  );
}