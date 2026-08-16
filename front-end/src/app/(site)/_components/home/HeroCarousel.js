// src/app/(site)/_components/home/HeroCarousel.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { heroSlides } from "@/data/heroSlides";
import { Icon } from "@/components/ui/Icons";

const AUTOPLAY_DELAY = 6500;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const move = (direction) => {
    setActiveIndex((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => move(1), AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      aria-label="Featured Burger O'Clock campaigns"
      className="relative z-10 pb-[18px] max-[820px]:pt-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Outer Tray Frame */}
      <div className="relative mx-auto overflow-hidden bg-[#141414] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all w-[calc(100%-24px)] md:w-[min(100%-56px,1680px)] h-[520px] md:h-[clamp(420px,42vw,680px)] border-[8px] md:border-[20px] border-[#242424] rounded-[24px] md:rounded-[36px]">
        
        {/* Slides */}
        {heroSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <article
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-550 ease-in-out ${
                isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              key={slide.id}
            >
              <Image
                alt={slide.imageAlt}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 1680px"
                src={slide.image}
                className="object-cover object-center"
              />

              {/* Glassmorphic Promo Overlay Box */}
              <div className="absolute inset-auto bottom-8 left-4 right-4 md:bottom-11 md:left-11 md:right-auto w-auto md:w-[min(420px,calc(100%-88px))] p-5 md:p-[26px] rounded-[18px] bg-black/68 backdrop-blur-[6px] text-white">
                <p className="m-0 mb-1 text-[#F4C61A] font-extrabold uppercase tracking-[0.12em] text-[0.72rem]">
                  {slide.eyebrow}
                </p>
                <h1 className="m-0 font-display font-black text-[clamp(2rem,4vw,4rem)] leading-[0.95] uppercase tracking-tight">
                  {slide.title}
                </h1>
                <span className="block mt-3 text-[#eeeeee] text-sm md:text-base leading-[1.55]">
                  {slide.description}
                </span>
                <Link
                  href={`#${slide.categoryId}`}
                  className="inline-flex mt-[18px] pb-1 border-b-2 border-[#F4C61A] text-white font-extrabold text-sm hover:text-[#F4C61A] transition-colors"
                >
                  Explore category
                </Link>
              </div>
            </article>
          );
        })}

        {/* Navigation Arrows */}
        <button
          aria-label="Previous campaign"
          className="absolute top-1/2 left-3 -translate-y-1/2 grid place-items-center w-[42px] h-[42px] md:w-12 md:h-12 rounded-full bg-white/85 text-[#555555] shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:bg-white hover:text-black transition-all"
          onClick={() => move(-1)}
          type="button"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <button
          aria-label="Next campaign"
          className="absolute top-1/2 right-3 -translate-y-1/2 grid place-items-center w-[42px] h-[42px] md:w-12 md:h-12 rounded-full bg-white/85 text-[#555555] shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:bg-white hover:text-black transition-all"
          onClick={() => move(1)}
          type="button"
        >
          <Icon name="chevronRight" size={20} />
        </button>

        {/* Pagination Dots */}
        <div
          aria-label="Choose campaign"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-[7px]"
          role="tablist"
        >
          {heroSlides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                aria-label={`Show ${slide.title}`}
                aria-selected={isActive}
                className={`h-[9px] rounded-full transition-all duration-300 ${
                  isActive ? "w-[38px] bg-white" : "w-[9px] bg-white/38 hover:bg-white/60"
                }`}
                key={slide.id}
                onClick={() => setActiveIndex(index)}
                role="tab"
                type="button"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}