// src/app/(site)/_components/home/CategoryRail.js
"use client";

import { useEffect, useRef, useState } from "react";
import { menuCategories } from "@/data/menuCategories";
import { Icon } from "@/components/ui/Icons";

export function CategoryRail() {
  const [activeId, setActiveId] = useState(menuCategories[0]?.id || "");
  const railRef = useRef(null);

  useEffect(() => {
    const sections = menuCategories
      .map((category) => document.getElementById(category.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-25% 0px -60%", threshold: [0.08, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollRail = (direction) => {
    railRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-40 border-y border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="w-full sm:w-[min(1120px,calc(100%-24px))] mx-auto grid grid-cols-1 sm:grid-cols-[38px_minmax(0,1fr)_38px] items-center gap-2">
        {/* Left Arrow Button */}
        <button
          aria-label="Scroll categories left"
          className="hidden sm:grid w-[34px] h-[34px] place-items-center rounded-full bg-transparent text-neutral-800 hover:bg-neutral-100 transition-colors"
          onClick={() => scrollRail(-1)}
          type="button"
        >
          <Icon name="chevronLeft" size={18} />
        </button>

        {/* Scrollable Category Nav */}
        <nav
          aria-label="Menu categories"
          className="flex items-center gap-2.5 py-3 px-3.5 sm:px-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          ref={railRef}
        >
          {menuCategories.map((category) => {
            const isActive = activeId === category.id;
            return (
              <a
                aria-current={isActive ? "true" : undefined}
                className={`shrink-0 px-5 py-[9px] border rounded-full text-[0.78rem] font-extrabold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "border-[#E0B210] bg-[#F4C61A] text-black shadow-xs"
                    : "border-black bg-transparent text-neutral-900 hover:border-[#E0B210] hover:bg-[#F4C61A] hover:text-black"
                }`}
                href={`#${category.id}`}
                key={category.id}
                onClick={() => setActiveId(category.id)}
              >
                {category.label}
              </a>
            );
          })}
        </nav>

        {/* Right Arrow Button */}
        <button
          aria-label="Scroll categories right"
          className="hidden sm:grid w-[34px] h-[34px] place-items-center rounded-full bg-transparent text-neutral-800 hover:bg-neutral-100 transition-colors"
          onClick={() => scrollRail(1)}
          type="button"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}