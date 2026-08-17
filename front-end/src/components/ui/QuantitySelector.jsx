// src/components/ui/QuantitySelector.jsx
"use client";

import { Icon } from "@/components/ui/Icons";

export function QuantitySelector({ quantity, onIncrease, onDecrease, min = 1, showTrashOnMin = true }) {
  const isMin = quantity <= min;

  return (
    <div className="inline-flex items-center border border-amber-200 rounded-xl p-1 bg-amber-50/50 shrink-0 select-none shadow-xs">
      <button
        type="button"
        onClick={onDecrease}
        disabled={isMin && !showTrashOnMin}
        aria-label={isMin ? "Remove item" : "Decrease quantity"}
        className={`grid place-items-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
          isMin && showTrashOnMin
            ? "text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80"
            : "text-neutral-800 bg-white hover:bg-neutral-100 disabled:opacity-40"
        }`}
      >
        <Icon
          name={isMin && showTrashOnMin ? "trash" : "minus"}
          size={14}
          strokeWidth={2.6}
        />
      </button>

      <span className="w-8 text-center text-sm font-black text-neutral-950">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="grid place-items-center w-8 h-8 rounded-lg bg-[#F4C61A] text-neutral-950 hover:bg-[#E0B210] active:scale-95 transition-all cursor-pointer shadow-xs"
      >
        <Icon name="plus" size={14} strokeWidth={2.8} />
      </button>
    </div>
  );
}