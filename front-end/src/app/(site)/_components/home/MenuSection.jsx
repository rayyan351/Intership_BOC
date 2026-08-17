// src/app/(site)/_components/home/MenuSection.jsx
"use client";

import Image from "next/image";
import { ProductCard } from "../products/ProductCard";
import { DealCard } from "../deals/DealCard";

export function MenuSection({ category, categoryIndex = 0 }) {
  const sectionTitle = category.name || category.label || "";
  const items = category.items || [];

  const rawId = String(category.id || category.slug || category._id || `section_${categoryIndex}`);
  const mongoId = String(category._id || "");
  const slug = String(category.slug || "");

  // Safe resolver for Express backend asset URLs
  const resolveBannerUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const bannerSrc = resolveBannerUrl(category.banner);

  return (
    <section
      className="w-[calc(100%-24px)] md:w-[min(1120px,calc(100%-40px))] mx-auto pt-10 md:pt-14 pb-8 scroll-mt-24 menu-section-container"
      id={rawId}
      data-section-id={mongoId || rawId}
      data-mongo-id={mongoId}
      data-slug={slug}
      data-title={sectionTitle.toLowerCase()}
    >
      {/* Section Divider Banner (e.g. The Classics / Loaded Fries) */}
      {bannerSrc && (
        <div className="relative w-full h-[130px] sm:h-[160px] md:h-[clamp(160px,18vw,240px)] mb-9 overflow-hidden rounded-[18px] md:rounded-[26px] border-[6px] md:border-[10px] border-[#242424] bg-neutral-900 shadow-md">
          <Image
            alt={`${sectionTitle} section banner`}
            fill
            unoptimized
            sizes="(max-width: 1440px) 100vw, 1280px"
            src={bannerSrc}
            className="object-cover object-center"
            priority={categoryIndex === 0}
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