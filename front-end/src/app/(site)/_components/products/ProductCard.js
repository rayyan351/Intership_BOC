// src/app/(site)/_components/home/ProductCard.js
"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { ProductDetailModal } from "./ProductDetailModal";

export function ProductCard({ product, compact = false }) {
  const [modalOpen, setModalOpen] = useState(false);

  const isAvailable = product.available !== false && product.isAvailable !== false;

  return (
    <>
      <article
        onClick={() => isAvailable && setModalOpen(true)}
        className="group flex flex-col h-full min-w-0 overflow-hidden rounded-[18px] border border-[#aeb7c6] bg-white shadow-[0_8px_20px_rgba(23,27,34,0.04)] transition-all duration-200 hover:-translate-y-[5px] hover:shadow-[0_18px_36px_rgba(23,27,34,0.1)] cursor-pointer"
      >
        {/* Image Container */}
        <div
          className={`relative w-full overflow-hidden bg-[#fafafa] ${
            compact ? "aspect-[1.25/1]" : "aspect-[1.08/1]"
          }`}
        >
          {product.discountLabel && (
            <span className="absolute top-3 right-2.5 z-10 rounded-[7px] bg-[#F4C61A] px-2.5 py-[7px] text-[0.7rem] font-black text-black leading-none">
              {product.discountLabel}
            </span>
          )}
          <Image
            alt={product.name}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1100px) 45vw, 300px"
            src={product.image || "/placeholder.png"}
            className="object-contain p-3.5 transition-transform duration-250 group-hover:scale-[1.03]"
          />
        </div>

        {/* Content Body */}
        <div className="grid flex-1 gap-4 p-4 pb-3.5">
          <div>
            <h3 className="m-0 text-base font-bold text-neutral-900 leading-[1.35]">
              {product.name}
            </h3>
            <p className="mt-2 text-[0.78rem] text-neutral-500 leading-[1.55] line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Pricing & Add to Cart */}
          <div className="flex items-baseline gap-2 mt-auto">
            <strong className="text-base font-black text-neutral-900">
              {formatPrice(product.price)}
            </strong>
            {product.compareAtPrice && (
              <del className="text-xs text-[#89909c]">
                {formatPrice(product.compareAtPrice)}
              </del>
            )}
          </div>

          <button
            disabled={!isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            type="button"
            className="self-end w-full min-h-[42px] rounded-full bg-[#F4C61A] px-4 text-[0.75rem] font-black uppercase tracking-wider text-black transition-colors hover:bg-[#E0B210] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isAvailable ? "Add to cart" : "Unavailable"}
          </button>
        </div>
      </article>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}