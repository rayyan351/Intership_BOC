// src/app/(site)/_components/home/MenuExplorer.js
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { useGetMenuFeedQuery } from "@/services/menuApi";
import { ProductCard } from "../products/ProductCard";
import { DealCard } from "../deals/DealCard";
import { MenuSkeleton } from "./MenuSkeleton";

export function MenuExplorer() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const { data: feedData, isLoading, isError } = useGetMenuFeedQuery();

  const categories = useMemo(() => feedData?.data?.categories || [], [feedData]);
  const sections = useMemo(() => feedData?.data?.sections || [], [feedData]);
  
  const allItems = useMemo(() => {
    if (!feedData?.data) return [];
    return [...(feedData.data.products || []), ...(feedData.data.deals || [])];
  }, [feedData]);

  // Helper string normalizer for robust comparison
  const normalizeKey = (val) =>
    (val || "")
      .toString()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const groupedCategories = useMemo(() => {
    // 1. If Admin configured dynamic curated Sections, use them directly
    if (sections && sections.length > 0) {
      return sections.map((sec) => {
        const secItems = sec.items || [];
        const visibleItems = normalizedQuery
          ? secItems.filter((item) =>
              `${item.title || item.name || ""} ${item.description || ""}`
                .toLowerCase()
                .includes(normalizedQuery)
            )
          : secItems;

        return {
          id: sec.slug || sec._id || sec.id,
          name: sec.title,
          label: sec.title,
          subtitle: sec.subtitle,
          banner: sec.banner,
          items: visibleItems,
          totalItems: secItems.length,
        };
      });
    }

    // 2. Otherwise, group by categories / dealType
    return categories.map((category) => {
      const rawCatKey = category.id || category.slug || category._id || "";
      const rawCatLabel = category.label || category.name || "";
      
      const normCatKey = normalizeKey(rawCatKey);
      const normCatLabel = normalizeKey(rawCatLabel);

      const isPopularCategory =
        normCatKey === "popularitems" ||
        normCatKey === "popular" ||
        normCatLabel === "popularitems";

      const categoryItems = allItems.filter((item) => {
        // Popular items filter
        if (isPopularCategory) {
          return Boolean(item.popular || item.isPopular);
        }

        // Deal matching
        if (item.isDeal) {
          const dealTypeNorm = normalizeKey(item.dealType);
          if (dealTypeNorm && (dealTypeNorm === normCatKey || dealTypeNorm === normCatLabel)) {
            return true;
          }
          if (Array.isArray(item.categories)) {
            return item.categories.some((c) => {
              const cNorm = normalizeKey(c);
              return cNorm === normCatKey || cNorm === normCatLabel;
            });
          }
        }

        // Product category array matching
        if (Array.isArray(item.categories) && item.categories.length > 0) {
          return item.categories.some((c) => {
            const cNorm = normalizeKey(c);
            return (
              cNorm === normCatKey ||
              cNorm === normCatLabel ||
              c === category._id?.toString()
            );
          });
        }

        // Single category reference fallback
        const singleCat = item.categoryId || item.category;
        if (singleCat) {
          const singleNorm = normalizeKey(singleCat);
          return (
            singleNorm === normCatKey ||
            singleNorm === normCatLabel ||
            singleCat?.toString() === category._id?.toString()
          );
        }

        return false;
      });

      const visibleItems = normalizedQuery
        ? categoryItems.filter((item) =>
            `${item.title || item.name || ""} ${item.description || ""}`
              .toLowerCase()
              .includes(normalizedQuery)
          )
        : categoryItems;

      return {
        ...category,
        items: visibleItems,
        totalItems: categoryItems.length,
      };
    });
  }, [sections, categories, allItems, normalizedQuery]);

  const populatedCategories = groupedCategories.filter((cat) => cat.items.length > 0);

  if (isLoading) {
    return (
      <main id="menu">
        <MenuSkeleton />
      </main>
    );
  }

  if (isError) {
    return (
      <div className="w-[min(1120px,calc(100%-40px))] mx-auto my-16 p-8 text-center rounded-2xl bg-red-50 text-red-700">
        <p className="font-bold">Failed to load the menu feed. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <main id="menu">
      {/* Search Header */}
      <section className="px-5 pt-11 pb-6" aria-label="Search the menu">
        <label className="flex items-center gap-3.5 w-[min(100%,500px)] min-h-[54px] mx-auto px-4 py-1 border-2 border-[#F4C61A] rounded-full bg-white shadow-xs">
          <Icon name="search" size={20} className="text-neutral-500 shrink-0" />
          <span className="sr-only">Search menu products</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search burgers, combos and deals"
            type="search"
            value={query}
            className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm md:text-base text-neutral-900 placeholder:text-neutral-400"
          />
          <button
            aria-label="Submit menu search"
            type="button"
            className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-[#F4C61A] text-black hover:bg-[#E0B210] transition-colors"
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </label>
      </section>

      {/* No Results Fallback */}
      {populatedCategories.length === 0 && (
        <section className="w-[min(1120px,calc(100%-40px))] mx-auto my-12 p-12 text-center rounded-[18px] bg-neutral-100">
          <h2 className="text-xl font-bold text-neutral-800">
            No items matched “{query}”
          </h2>
          <button
            onClick={() => setQuery("")}
            type="button"
            className="mt-4 px-5 py-3 rounded-full bg-[#F4C61A] text-black font-extrabold text-sm hover:bg-[#E0B210] transition-colors"
          >
            Clear search
          </button>
        </section>
      )}

      {/* Populated Category / Section Lists */}
      {populatedCategories.map((category, categoryIndex) => (
        <section
          className="w-[calc(100%-24px)] md:w-[min(1120px,calc(100%-40px))] mx-auto pt-10 md:pt-14 pb-8 scroll-mt-20"
          id={category.id || category.slug || category._id}
          key={category._id || category.id}
        >
          {category.banner && (
            <div className="relative h-[140px] md:h-[clamp(150px,15vw,220px)] mb-9 overflow-hidden rounded-[18px] md:rounded-[24px] border-[6px] md:border-[9px] border-[#242424] bg-neutral-200">
              <Image
                alt={`${category.name || category.label} category banner`}
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
                  {category.name || category.label}
                </h2>
              </div>
              {category.subtitle && (
                <p className="mt-0.5 text-xs font-medium text-neutral-400">
                  {category.subtitle}
                </p>
              )}
              <p className="mt-1 text-sm text-neutral-500">
                {category.items.length} items available
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
            {category.items.map((item) =>
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
      ))}
    </main>
  );
}