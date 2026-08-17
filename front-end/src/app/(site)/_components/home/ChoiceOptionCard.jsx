// src/app/(site)/_components/home/ChoiceOptionCard.jsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { Icon } from "@/components/ui/Icons";

export function ChoiceOptionCard({
  option,
  isSelected,
  isSingle,
  count = 0,
  maxReached = false,
  onSelect,
  onIncrement,
  onDecrement,
}) {
  const [imgError, setImgError] = useState(false);

  const rawImg =
    option.image ||
    option.imageUrl ||
    option.product?.image ||
    option.product?.imageUrl ||
    "";

  const hasValidImage = Boolean(rawImg && !imgError);

  // 1. Single Choice (Radio Button behavior)
  if (isSingle) {
    return (
      <div
        onClick={onSelect}
        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 cursor-pointer select-none ${
          isSelected
            ? "border-[#F4C61A] bg-amber-50/50 shadow-xs"
            : "border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`grid place-items-center w-5 h-5 rounded-full border transition-all shrink-0 ${
              isSelected
                ? "border-[#F4C61A] bg-[#F4C61A]"
                : "border-neutral-300 bg-white group-hover:border-neutral-400"
            }`}
          >
            {isSelected && <span className="w-2 h-2 rounded-full bg-neutral-950" />}
          </div>

          {hasValidImage && (
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 shrink-0">
              <Image
                src={rawImg}
                alt={option.name || "Option"}
                fill
                unoptimized
                sizes="40px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <span className="text-xs font-bold text-neutral-800 truncate">
            {option.name || option.product?.name}
          </span>
        </div>

        {option.extraPrice > 0 && (
          <span className="text-[11px] font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md shrink-0 ml-2">
            +{formatPrice(option.extraPrice)}
          </span>
        )}
      </div>
    );
  }

  // 2. Multi-Choice with Stepper (Allows duplicate selections e.g. 2x Chick N Crisp)
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 ${
        count > 0
          ? "border-[#F4C61A] bg-amber-50/40 shadow-xs"
          : "border-neutral-200/80 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {hasValidImage && (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 shrink-0">
            <Image
              src={rawImg}
              alt={option.name || "Option"}
              fill
              unoptimized
              sizes="40px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs font-bold text-neutral-800 truncate m-0">
            {option.name || option.product?.name}
          </p>
          {option.extraPrice > 0 && (
            <span className="text-[10px] font-extrabold text-amber-700">
              +{formatPrice(option.extraPrice)} each
            </span>
          )}
        </div>
      </div>

      {/* Counter Controls */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {count === 0 ? (
          <button
            type="button"
            disabled={maxReached}
            onClick={onIncrement}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-[#F4C61A] text-neutral-950 text-xs font-black hover:bg-[#F4C61A] transition-colors disabled:opacity-30 disabled:border-neutral-200 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Add</span>
            <Icon name="plus" size={12} strokeWidth={3} />
          </button>
        ) : (
          <div className="flex items-center border border-[#F4C61A] rounded-xl bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={onDecrement}
              aria-label="Decrease choice count"
              className="grid place-items-center w-7 h-7 rounded-lg text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              <Icon name="minus" size={12} strokeWidth={2.5} />
            </button>

            <span className="w-6 text-center text-xs font-black text-neutral-900">
              {count}
            </span>

            <button
              type="button"
              disabled={maxReached}
              onClick={onIncrement}
              aria-label="Increase choice count"
              className="grid place-items-center w-7 h-7 rounded-lg bg-[#F4C61A] text-neutral-950 hover:bg-[#E0B210] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="plus" size={12} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}