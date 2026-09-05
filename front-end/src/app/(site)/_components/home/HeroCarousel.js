// src/app/(site)/_components/home/HeroCarousel.jsx
"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { heroSlides as staticFallbackSlides } from "@/data/heroSlides";
import { Icon } from "@/components/ui/Icons";
import { BannerCTAButton } from "@/components/ui/BannerCTAButton";
import { getImageUrl } from "@/config/site";

const AUTOPLAY_DELAY = 6500;

export function HeroCarousel({ banners = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b, idx) => ({
        id: b._id?.toString() || b.id || `banner_${idx}`,
        title: b.title || "Featured Campaign",
        image: getImageUrl(b.desktopImage || b.image || "/placeholder.png"),
        link: b.link || "",
        ctaText: b.ctaText || "",
      }));
    }
    return (staticFallbackSlides || []).map((s) => ({
      id: s.id,
      title: s.title,
      image: getImageUrl(s.image),
      link: s.categoryId ? `#${s.categoryId}` : "#deals",
      ctaText: s.ctaText || "",
    }));
  }, [banners]);

  const move = (direction) => {
    if (slides.length <= 1) return;
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  };

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined;
    const timer = window.setInterval(() => move(1), AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const scrollToTarget = (link) => {
    if (!link) return;

    // Handle full external URLs or different paths
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.location.href = link;
      return;
    }

    if (link.startsWith("/") && !link.startsWith("/#")) {
      window.location.href = link;
      return;
    }

    // Extract target identifier (strip '#', '/#', whitespace)
    const targetKey = link.replace(/^\/?#/, "").trim();
    if (!targetKey) return;

    const normalizedTarget = targetKey.toLowerCase().replace(/[\s_-]+/g, "");

    // 1. Check exact ID match
    let targetEl = document.getElementById(targetKey);

    // 2. Check data attributes & partial attribute matching
    if (!targetEl) {
      targetEl =
        document.querySelector(`[data-section-id="${targetKey}"]`) ||
        document.querySelector(`[data-mongo-id="${targetKey}"]`) ||
        document.querySelector(`[data-slug="${targetKey}"]`) ||
        document.querySelector(`[id="${targetKey}"]`);
    }

    // 3. Fallback: scan all rendered sections on the page
    if (!targetEl) {
      const sections = Array.from(document.querySelectorAll("section.menu-section-container, section[id]"));
      targetEl = sections.find((sec) => {
        const id = (sec.id || "").toLowerCase().replace(/[\s_-]+/g, "");
        const mongoId = (sec.getAttribute("data-mongo-id") || "").toLowerCase();
        const slug = (sec.getAttribute("data-slug") || "").toLowerCase();
        const title = (sec.getAttribute("data-title") || "").toLowerCase().replace(/[\s_-]+/g, "");

        return (
          id === normalizedTarget ||
          mongoId === targetKey.toLowerCase() ||
          slug === normalizedTarget ||
          title.includes(normalizedTarget) ||
          id.includes(normalizedTarget)
        );
      });
    }

    // 4. Update the URL cleanly in address bar
    window.history.replaceState(null, "", `${window.location.pathname}#${targetKey}`);

    // 5. Perform smooth scroll with header offset
    if (targetEl) {
      const yOffset = -90; // Adjust for sticky CategoryRail header
      const yCoordinate = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: yCoordinate, behavior: "smooth" });
    } else {
      console.warn(`Could not locate DOM section matching target: "${targetKey}"`);
    }
  };

  if (!slides || slides.length === 0) return null;

  return (
    <section
      aria-label="Featured Burger O'Clock campaigns"
      className="relative z-10 pb-[18px] max-[820px]:pt-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto overflow-hidden bg-[#141414] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all w-[calc(100%-24px)] md:w-[min(100%-56px,1680px)] h-[520px] md:h-[clamp(420px,42vw,680px)] border-[8px] md:border-[20px] border-[#242424] rounded-[24px] md:rounded-[36px]">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const hasLink = Boolean(slide.link);
          const hasCTA = Boolean(slide.ctaText);

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              onClick={() => {
                if (isActive && hasLink) {
                  scrollToTarget(slide.link);
                }
              }}
              className={`absolute inset-0 transition-opacity duration-550 ease-in-out select-none ${
                isActive
                  ? "opacity-100 pointer-events-auto z-10"
                  : "opacity-0 pointer-events-none z-0"
              } ${hasLink ? "cursor-pointer" : "cursor-default"}`}
            >
              {slide.image && (
                <Image
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 1680px"
                  src={slide.image}
                  className="object-cover object-center pointer-events-none"
                />
              )}

              {/* Optional Custom Reusable CTA Button */}
              {hasCTA && (
                <div className="absolute inset-x-0 bottom-8 sm:bottom-12 z-20 flex justify-center sm:justify-start px-6 sm:px-12 pointer-events-auto">
                  <BannerCTAButton
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToTarget(slide.link);
                    }}
                  >
                    {slide.ctaText}
                  </BannerCTAButton>
                </div>
              )}
            </div>
          );
        })}

        {/* Navigation Controls */}
        {slides.length > 1 && (
          <>
            <button
              aria-label="Previous campaign"
              className="absolute top-1/2 left-3.5 -translate-y-1/2 grid place-items-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-white hover:text-black transition-all cursor-pointer z-30"
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              type="button"
            >
              <Icon name="chevronLeft" size={20} strokeWidth={2.5} />
            </button>

            <button
              aria-label="Next campaign"
              className="absolute top-1/2 right-3.5 -translate-y-1/2 grid place-items-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-white hover:text-black transition-all cursor-pointer z-30"
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              type="button"
            >
              <Icon name="chevronRight" size={20} strokeWidth={2.5} />
            </button>

            <div
              aria-label="Choose campaign"
              className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30"
              role="tablist"
            >
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    aria-label={`Show ${slide.title}`}
                    aria-selected={isActive}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive ? "w-8 bg-white shadow-xs" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    key={slide.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(index);
                    }}
                    role="tab"
                    type="button"
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}