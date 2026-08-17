// src/app/(site)/_components/products/ProductCard.jsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { ProductDetailModal } from "./ProductDetailModal";

export function ProductCard({ product }) {
  const [modalOpen, setModalOpen] = useState(false);

  const price = product.price || 0;
  const comparePrice = product.compareAtPrice || 0;
  const productImg = product.image || "";

  return (
    <>
      <article
        onClick={() => setModalOpen(true)}
        className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >
        {/* Product Image Container */}
        <div className="relative aspect-[1/1] w-full overflow-hidden bg-neutral-50 p-2.5">
          {product.discountLabel && (
            <span className="absolute top-3 right-3 z-10 rounded-md bg-[#F4C61A] px-2 py-0.5 text-[11px] font-black text-neutral-950 shadow-xs">
              {product.discountLabel}
            </span>
          )}

          {productImg ? (
            <Image
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={productImg}
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs font-semibold text-neutral-400">
              No Image Available
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-1 flex-col p-4 sm:p-5 pt-2.5">
          <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
            {product.name}
          </h3>

          <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 leading-relaxed min-h-[36px]">
            {product.description || "Crispy, fresh, and made to order."}
          </p>

          {/* Pricing & Add to Cart Button */}
          <div className="mt-auto pt-4 flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-neutral-950">
                {formatPrice(price)}
              </span>
              {comparePrice > price && (
                <del className="text-xs font-semibold text-neutral-400">
                  {formatPrice(comparePrice)}
                </del>
              )}
            </div>

            <AddToCartButton
              label="Add to Cart"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
            />
          </div>
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