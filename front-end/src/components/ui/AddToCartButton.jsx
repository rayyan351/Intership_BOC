// src/components/ui/AddToCartButton.jsx
"use client";

import { Icon } from "@/components/ui/Icons";

export function AddToCartButton({
  onClick,
  label = "Add to Cart",
  icon = "chevronRight",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl bg-[#F4C61A] text-neutral-950 text-[12px] font-bold tracking-wide transition-all duration-150 hover:bg-[#E5B80B] active:scale-[0.98] cursor-pointer shadow-[0_2px_8px_rgba(244,198,26,0.25)] hover:shadow-[0_4px_12px_rgba(244,198,26,0.35)] ${className}`}
    >
      <span>{label}</span>
      {icon && <Icon name={icon} size={14} className="stroke-[2.5]" />}
    </button>
  );
}