// src/app/(site)/_components/home/DealCard.jsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { DealCustomizerModal } from "./DealCustomizerModal";

export function DealCard({ deal }) {
  const [modalOpen, setModalOpen] = useState(false);

  const dealTitle = deal.title || deal.name || "Special Deal";
  const dealPrice = deal.dealPrice || deal.price || 0;
  const originalPrice = deal.originalPrice || 0;
  const dealImg =
    deal.image ||
    deal.banner ||
    deal.imageUrl ||
    deal.dealImage ||
    "";

  const discountPercent =
    originalPrice && dealPrice && originalPrice > dealPrice
      ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
      : 0;

  return (
    <>
      <article
        onClick={() => setModalOpen(true)}
        className="group flex flex-col h-full min-w-0 overflow-hidden rounded-[18px] border border-amber-300 bg-white shadow-[0_8px_20px_rgba(23,27,34,0.04)] transition-all duration-200 hover:-translate-y-[5px] hover:shadow-[0_18px_36px_rgba(23,27,34,0.12)] cursor-pointer"
      >
        {/* Deal Image Wrap */}
        <div className="relative aspect-[1.15/1] w-full overflow-hidden bg-neutral-900">
          {discountPercent > 0 && (
            <span className="absolute top-3 right-2.5 z-10 rounded-[7px] bg-[#F4C61A] px-2.5 py-[7px] text-[0.7rem] font-black text-black leading-none shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {dealImg ? (
            <Image
              alt={dealTitle}
              fill
              unoptimized
              sizes="(max-width: 640px) 85vw, (max-width: 1100px) 45vw, 300px"
              src={dealImg}
              className="object-cover p-1 transition-transform duration-250 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-neutral-800 text-xs font-semibold text-neutral-400">
              No Image Available
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="grid flex-1 gap-3.5 p-4 pb-3.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {deal.dealType || "Deal / Bundle"}
              </span>
            </div>
            <h3 className="m-0 text-base font-bold text-neutral-900 leading-[1.35]">
              {dealTitle}
            </h3>
            <p className="mt-1.5 text-[0.78rem] text-neutral-500 leading-[1.55] line-clamp-2">
              {deal.description}
            </p>
          </div>

          {/* Pricing & Customize CTA */}
          <div className="flex items-baseline gap-2 mt-auto">
            <strong className="text-base font-black text-neutral-900">
              {formatPrice(dealPrice)}
            </strong>
            {originalPrice > dealPrice && (
              <del className="text-xs text-[#89909c]">
                {formatPrice(originalPrice)}
              </del>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            type="button"
            className="self-end w-full min-h-[42px] rounded-full bg-[#F4C61A] px-4 text-[0.75rem] font-black uppercase tracking-wider text-black transition-colors hover:bg-[#E0B210]"
          >
            Customize & Add
          </button>
        </div>
      </article>

      {/* Deal Customizer Drawer */}
      <DealCustomizerModal
        deal={deal}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}