// src/app/(site)/_components/home/MenuSection.jsx
"use client";

import Image from "next/image";
import { ProductCard } from "../products/ProductCard";
import { DealCard } from "../deals/DealCard";

export function MenuSection({ category, categoryIndex = 0 }) {
  const sectionId = category.id || category.slug || category._id;
  const sectionTitle = category.name || category.label;
  const items = category.items || [];

  return (
    <section
      className="w-[calc(100%-24px)] md:w-[min(1120px,calc(100%-40px))] mx-auto pt-10 md:pt-14 pb-8 scroll-mt-20"
      id={sectionId}
    >
      {category.banner && (
        <div className="relative h-[140px] md:h-[clamp(150px,15vw,220px)] mb-9 overflow-hidden rounded-[18px] md:rounded-[24px] border-[6px] md:border-[9px] border-[#242424] bg-neutral-200">
          <Image
            alt={`${sectionTitle} category banner`}
            fill
            sizes="(max-width: 1440px) 100vw, 1280px"
            src={category.banner}
            className="object-cover"
          />
        </div>
      )}

      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6 mb-7">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-[clamp(1.6rem,2.4vw,2.2rem)] font-black uppercase tracking-tight text-neutral-900">
              {sectionTitle}
            </h2>
          </div>
          {category.subtitle && (
            <p className="mt-0.5 text-xs font-medium text-neutral-400">
              {category.subtitle}
            </p>
          )}
          <p className="mt-1 text-sm text-neutral-500">
            {items.length} {items.length === 1 ? "item" : "items"} available
          </p>
        </div>

        <a
          href="#menu"
          className="hidden sm:inline-block text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Back to menu ↑
        </a>
      </header>

      <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        {items.map((item) =>
          item.isDeal ? (
            <DealCard key={item._id || item.id} deal={item} />
          ) : (
            <ProductCard
              compact={categoryIndex === 0}
              key={item._id || item.id}
              product={item}
            />
          )
        )}
      </div>
    </section>
  );
}