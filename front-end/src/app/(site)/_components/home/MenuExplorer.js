// src/app/(site)/_components/home/MenuExplorer.jsx
"use client";

import { useMemo, useState } from "react";
import { MenuSection } from "./MenuSection";
import { MenuSearchHeader } from "./MenuSearchHeader";
import { MenuEmptyState } from "./MenuEmptyState";

export function MenuExplorer({
  categories = [],
  sections = [],
  products = [],
  deals = [],
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const allItems = useMemo(() => {
    return [...(products || []), ...(deals || [])];
  }, [products, deals]);

  const normalizeKey = (val) =>
    (val || "")
      .toString()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const groupedCategories = useMemo(() => {
    // 1. Curated Dynamic Sections from Admin
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

    // 2. Standard Category Grouping Fallback
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
        if (isPopularCategory) {
          return Boolean(item.popular || item.isPopular);
        }

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

  const populatedCategories = groupedCategories.filter(
    (cat) => cat.items && cat.items.length > 0
  );

  return (
    <main id="menu">
      <MenuSearchHeader
        query={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
      />

      {populatedCategories.length === 0 ? (
        <MenuEmptyState query={query} onReset={() => setQuery("")} />
      ) : (
        populatedCategories.map((category, categoryIndex) => (
          <MenuSection
            key={category._id || category.id || categoryIndex}
            category={category}
            categoryIndex={categoryIndex}
          />
        ))
      )}
    </main>
  );
}