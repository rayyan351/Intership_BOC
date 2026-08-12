"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { heroSlides } from "@/data/heroSlides";
import { Icon } from "@/components/ui/Icons";
import styles from "./HeroCarousel.module.css";

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
      className={styles.section}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.frame}>
        {heroSlides.map((slide, index) => (
          <article
            aria-hidden={index !== activeIndex}
            className={`${styles.slide} ${index === activeIndex ? styles.active : ""}`}
            key={slide.id}
          >
            <Image alt={slide.imageAlt} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 1440px" src={slide.image} />
            <div className={styles.overlay}>
              <p>{slide.eyebrow}</p>
              <h1>{slide.title}</h1>
              <span>{slide.description}</span>
              <a href={`#${slide.categoryId}`}>Explore category</a>
            </div>
          </article>
        ))}

        <button aria-label="Previous campaign" className={`${styles.arrow} ${styles.previous}`} onClick={() => move(-1)} type="button">
          <Icon name="chevronLeft" />
        </button>
        <button aria-label="Next campaign" className={`${styles.arrow} ${styles.next}`} onClick={() => move(1)} type="button">
          <Icon name="chevronRight" />
        </button>

        <div aria-label="Choose campaign" className={styles.pagination} role="tablist">
          {heroSlides.map((slide, index) => (
            <button
              aria-label={`Show ${slide.title}`}
              aria-selected={index === activeIndex}
              className={index === activeIndex ? styles.activeDot : ""}
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
