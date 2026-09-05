// src/app/(site)/_components/home/DealCard.jsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { DealCustomizerModal } from "./DealCustomizerModal";
import { getImageUrl } from "@/config/site";

export function DealCard({ deal }) {
  const [modalOpen, setModalOpen] = useState(false);

  const dealId = deal._id?.toString() || deal.id?.toString();

  const handleOpenModal = () => {
    // Cleanly set query param while stripping lingering hash anchors
    window.history.replaceState(null, "", `${window.location.pathname}?deal=${dealId}`);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    // Reset to clean pathname with no query params or lingering hashes
    window.history.replaceState(null, "", window.location.pathname);
    setModalOpen(false);
  };

  const dealTitle = deal.title || deal.name || "Special Deal";
  const dealPrice = deal.dealPrice || deal.price || 0;
  const originalPrice = deal.originalPrice || 0;
  const dealImg = getImageUrl(deal.image || deal.banner || deal.imageUrl || deal.dealImage || "");

  const discountPercent =
    originalPrice && dealPrice && originalPrice > dealPrice
      ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
      : 0;

  return (
    <>
      <article
        onClick={handleOpenModal}
        className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >
        <div className="relative aspect-[1/1] w-full overflow-hidden bg-neutral-50 p-2.5">
          {discountPercent > 0 && (
            <span className="absolute top-3 right-3 z-10 rounded-md bg-[#F4C61A] px-2 py-0.5 text-[11px] font-black text-neutral-950 shadow-xs">
              {discountPercent}% OFF
            </span>
          )}

          {dealImg ? (
            <Image
              alt={dealTitle}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={dealImg}
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs font-semibold text-neutral-400">
              No Image Available
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5 pt-2.5">
          <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
            {dealTitle}
          </h3>

          <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 leading-relaxed min-h-[36px]">
            {deal.description || "Special curated combo with fresh sides & drink."}
          </p>

          <div className="mt-auto pt-4 flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-neutral-950">
                {formatPrice(dealPrice)}
              </span>
              {originalPrice > dealPrice && (
                <del className="text-xs font-semibold text-neutral-400">
                  {formatPrice(originalPrice)}
                </del>
              )}
            </div>

            <AddToCartButton
              label="Customize & Add"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal();
              }}
            />
          </div>
        </div>
      </article>

      <DealCustomizerModal
        deal={deal}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}