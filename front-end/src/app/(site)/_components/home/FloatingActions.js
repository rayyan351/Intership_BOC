// src/app/(site)/_components/home/FloatingActions.js
"use client";

import { Icon } from "@/components/ui/Icons";

export function FloatingActions() {
  return (
    <>
      {/* Floating Search Action */}
      <button
        aria-label="Search menu"
        className="fixed z-50 bottom-[22px] left-[18px] grid place-items-center w-[50px] h-[50px] rounded-[15px] bg-[#F4C61A] text-black shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-[3px] hover:bg-[#E0B210]"
        onClick={() => document.querySelector('input[type="search"]')?.focus()}
        type="button"
      >
        <Icon name="search" size={20} />
      </button>

      {/* Floating Scroll-to-Top Action */}
      <button
        aria-label="Back to top"
        className="fixed z-50 bottom-[22px] right-[18px] grid place-items-center w-[50px] h-[50px] rounded-[15px] bg-[#F4C61A] text-black shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-[3px] hover:bg-[#E0B210]"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        type="button"
      >
        <Icon name="arrowUp" size={20} />
      </button>
    </>
  );
}