// src/components/ui/ModalActionButtons.jsx
"use client";

import { Icon } from "@/components/ui/Icons";

export function ModalActionButtons({ onClose, onShare }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {onShare && (
        <button
          onClick={onShare}
          type="button"
          aria-label="Share"
          className="grid place-items-center w-8 h-8 rounded-full bg-[#F4C61A] text-neutral-950 hover:bg-[#E0B210] active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Icon name="externalLink" size={14} strokeWidth={2.4} />
        </button>
      )}

      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="grid place-items-center w-8 h-8 rounded-full bg-[#F4C61A] text-neutral-950 hover:bg-[#E0B210] active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Icon name="close" size={14} strokeWidth={2.8} />
        </button>
      )}
    </div>
  );
}