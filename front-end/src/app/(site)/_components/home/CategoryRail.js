// src/app/(site)/_components/home/CategoryRail.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icons";

export function CategoryRail({
  categories: rawCategories = [],
  sections: rawSections = [],
  products = [],
  deals = [],
}) {
  const [activeId, setActiveId] = useState("");
  const railRef = useRef(null);

  const normalizeKey = (val) =>
    (val || "")
      .toString()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const categories = useMemo(() => {
    const allItems = [...(products || []), ...(deals || [])];

    if (rawSections && rawSections.length > 0) {
      return rawSections
        .filter((sec) => (sec.items || []).length > 0)
        .map((sec) => ({
          id: sec.slug || sec._id || sec.id,
          label: sec.title || sec.name,
        }));
    }

    return rawCategories
      .map((cat) => {
        const normKey = normalizeKey(cat.id || cat.slug || cat._id);
        const normLabel = normalizeKey(cat.label || cat.name);
        const isPopular = normKey === "popularitems" || normKey === "popular";

        const hasItems = allItems.some((item) => {
          if (isPopular) return Boolean(item.popular || item.isPopular);
          if (item.isDeal) {
            const dType = normalizeKey(item.dealType);
            if (dType === normKey || dType === normLabel) return true;
          }
          if (Array.isArray(item.categories)) {
            return item.categories.some((c) => {
              const cNorm = normalizeKey(c);
              return (
                cNorm === normKey ||
                cNorm === normLabel ||
                c === cat._id?.toString()
              );
            });
          }
          return false;
        });

        return {
          id: cat.slug || cat.id || cat._id,
          label: cat.label || cat.name,
          hasItems,
        };
      })
      .filter((cat) => cat.hasItems);
  }, [rawSections, rawCategories, products, deals]);

  useEffect(() => {
    if (categories.length > 0 && !activeId) {
      setActiveId(categories[0].id);
    }
  }, [categories, activeId]);

  useEffect(() => {
    if (categories.length === 0) return;

    const elements = categories
      .map((cat) => document.getElementById(cat.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.3, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    setActiveId(id);

    // Cleanly set only the hash, stripping stray query parameters
    window.history.replaceState(null, "", `${window.location.pathname}#${id}`);

    const targetEl = document.getElementById(id);
    if (targetEl) {
      const yOffset = -90;
      const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const scrollRail = (direction) => {
    railRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 border-y border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="w-full sm:w-[min(1120px,calc(100%-24px))] mx-auto grid grid-cols-1 sm:grid-cols-[38px_minmax(0,1fr)_38px] items-center gap-2">
        <button
          aria-label="Scroll categories left"
          className="hidden sm:grid w-[34px] h-[34px] place-items-center rounded-full bg-transparent text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
          onClick={() => scrollRail(-1)}
          type="button"
        >
          <Icon name="chevronLeft" size={18} />
        </button>

        <nav
          aria-label="Menu categories"
          className="flex items-center gap-2.5 py-3 px-3.5 sm:px-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          ref={railRef}
        >
          {categories.map((category) => {
            const isActive = activeId === category.id;
            return (
              <a
                aria-current={isActive ? "true" : undefined}
                className={`shrink-0 px-5 py-[9px] border rounded-full text-[0.78rem] font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer no-underline ${
                  isActive
                    ? "border-[#E0B210] bg-[#F4C61A] text-neutral-950 shadow-xs"
                    : "border-black bg-transparent text-neutral-900 hover:border-[#E0B210] hover:bg-[#F4C61A] hover:text-neutral-950"
                }`}
                href={`#${category.id}`}
                key={category.id}
                onClick={(e) => handleScrollTo(e, category.id)}
              >
                {category.label}
              </a>
            );
          })}
        </nav>

        <button
          aria-label="Scroll categories right"
          className="hidden sm:grid w-[34px] h-[34px] place-items-center rounded-full bg-transparent text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
          onClick={() => scrollRail(1)}
          type="button"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}